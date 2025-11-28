import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { apiService } from '../services/apiService';

AgoraRTC.enableLogUpload();

export function useConvoAI() {
  const [client] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agentId, setAgentId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  
  const configRef = useRef(null);
  const localTracksRef = useRef({ audioTrack: null, videoTrack: null });
  const messageBufferRef = useRef({});
  const volumeCheckIntervalRef = useRef(null);

  // Load conversation history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ackai_conversation_history');
      if (saved) {
        setConversation(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading conversation history:', e);
    }
  }, []);

  // Save conversation history to localStorage
  const saveConversation = useCallback((messages) => {
    try {
      localStorage.setItem('ackai_conversation_history', JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving conversation history:', e);
    }
  }, []);

  // Add message to conversation
  const addMessage = useCallback((role, content) => {
    const newMessage = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    
    setConversation(prev => {
      const updated = [...prev, newMessage];
      // Keep only last 20 messages
      const limited = updated.slice(-20);
      saveConversation(limited);
      return limited;
    });
  }, [saveConversation]);

  // Clear conversation history
  const clearConversation = useCallback(() => {
    setConversation([]);
    localStorage.removeItem('ackai_conversation_history');
  }, []);

  // Handle remote user published (AI agent audio/video)
  const handleUserPublished = useCallback(async (user, mediaType) => {
    console.log('User published:', user.uid, mediaType);
    
    try {
      await client.subscribe(user, mediaType);
      console.log('Successfully subscribed to', user.uid, mediaType);
      
      if (mediaType === "audio") {
        user.audioTrack?.play();
        console.log('Playing AI audio from user:', user.uid);
        
        // Monitor AI speaking via volume level
        if (user.audioTrack) {
          const checkVolume = setInterval(() => {
            try {
              if (user.audioTrack) {
                const volume = user.audioTrack.getVolumeLevel();
                setIsAISpeaking(volume > 0.1); // Threshold for speaking detection
              } else {
                setIsAISpeaking(false);
              }
            } catch (e) {
              // Track might be disposed, stop checking
              setIsAISpeaking(false);
            }
          }, 100);
          
          // Store interval to clear later
          if (!volumeCheckIntervalRef.current) {
            volumeCheckIntervalRef.current = {};
          }
          volumeCheckIntervalRef.current.ai = checkVolume;
        }
      }
      
      if (mediaType === "video") {
        // Play AI video in the remote player
        const remotePlayerContainer = document.getElementById('remote-playerlist');
        if (remotePlayerContainer) {
          user.videoTrack?.play(remotePlayerContainer);
          console.log('Playing AI video from user:', user.uid);
        } else {
          console.error('Remote player container not found!');
          // Retry after a short delay
          setTimeout(() => {
            const container = document.getElementById('remote-playerlist');
            if (container && user.videoTrack) {
              user.videoTrack.play(container);
              console.log('Playing AI video (retry) from user:', user.uid);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error subscribing to user:', error);
    }
  }, [client]);

  // Handle remote user unpublished
  const handleUserUnpublished = useCallback((user, mediaType) => {
    console.log('User unpublished:', user.uid, mediaType);
  }, []);

  // Handle user left
  const handleUserLeft = useCallback((user) => {
    console.log('User left:', user.uid);
  }, []);

  // Start AI call
  const startCall = useCallback(async (initialQuestion = null) => {
    // Prevent starting if already connected or loading
    if (isConnected || isLoading) {
      console.log('Call already in progress, skipping startCall');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Check if client is already connected
      if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        console.log('Client already connected/connecting, leaving first...');
        await client.leave();
      }

      // Get config from backend
      if (!configRef.current) {
        configRef.current = await apiService.getConfig();
      }
      const config = configRef.current;
      
      // Generate unique channel name
      const channel = `legal_ai_${Date.now()}`;
      setChannelName(channel);

      // Fixed UID for user
      const uid = 10000;

      console.log('Setting up Agora RTC client...');

      // Setup event listeners BEFORE joining
      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);
      client.on("user-left", handleUserLeft);

      // Listen for stream messages (AI conversation transcription)
      client.on("stream-message", (senderUid, data) => {
        try {
          const message = new TextDecoder().decode(data);
          console.log("Received stream message from UID", senderUid);
          console.log("Message preview:", message.substring(0, 100));
          
          // Try to parse as direct JSON first
          try {
            const parsed = JSON.parse(message);
            console.log("Direct JSON parse successful:", parsed);
            
            if (parsed.object === 'assistant.transcription' && parsed.text) {
              console.log("Adding assistant message:", parsed.text);
              addMessage('assistant', parsed.text);
              return;
            } else if (parsed.object === 'user.transcription' && parsed.text) {
              console.log("Adding user message:", parsed.text);
              addMessage('user', parsed.text);
              return;
            }
          } catch (directParseError) {
            // Not direct JSON, try multi-part logic
            console.log("Not direct JSON, checking for multi-part message");
          }
          
          // Check if it's a multi-part message
          if (message.includes('|') && message.split('|').length >= 4) {
            const parts = message.split('|');
            const msgId = parts[0];
            const partNum = parseInt(parts[1]);
            const totalParts = parseInt(parts[2]);
            const base64Part = parts[3];
            
            console.log(`Multi-part message detected: ID=${msgId}, part ${partNum}/${totalParts}`);
            
            if (!messageBufferRef.current[msgId]) {
              messageBufferRef.current[msgId] = {
                parts: new Array(totalParts),
                totalParts: totalParts,
                receivedParts: 0
              };
            }
            
            messageBufferRef.current[msgId].parts[partNum - 1] = base64Part;
            messageBufferRef.current[msgId].receivedParts++;
            
            console.log(`Message ${msgId}: received ${messageBufferRef.current[msgId].receivedParts}/${totalParts} parts`);
            
            if (messageBufferRef.current[msgId].receivedParts === totalParts) {
              try {
                const completeBase64 = messageBufferRef.current[msgId].parts.join('');
                console.log("Reconstructing from base64, length:", completeBase64.length);
                
                const decoded = atob(completeBase64);
                console.log("Decoded string length:", decoded.length);
                console.log("Decoded preview:", decoded.substring(0, 200));
                
                // Validate JSON before parsing
                if (!decoded || decoded.trim().length === 0) {
                  console.error("Empty decoded message");
                  delete messageBufferRef.current[msgId];
                  return;
                }
                
                const parsed = JSON.parse(decoded);
                console.log("Successfully parsed reconstructed message:", parsed);
                
                if (parsed.object === 'assistant.transcription' && parsed.text) {
                  addMessage('assistant', parsed.text);
                } else if (parsed.object === 'user.transcription' && parsed.text) {
                  addMessage('user', parsed.text);
                }
                
                delete messageBufferRef.current[msgId];
              } catch (e) {
                console.error("Error processing reconstructed message:", e);
                console.error("Failed message ID:", msgId);
                // Clean up failed message
                delete messageBufferRef.current[msgId];
              }
            }
          } else {
            // Not JSON and not multi-part, treat as plain text from AI
            console.log("Plain text message from UID", senderUid);
            if (senderUid === 10001 || senderUid === 10002) {
              console.log("Adding as assistant message:", message);
              addMessage('assistant', message);
            }
          }
        } catch (e) {
          console.error("Error processing stream message:", e);
        }
      });

      // Join RTC channel
      console.log('Joining channel:', channel, 'with UID:', uid);
      await client.join(
        config.AGORA_APPID,
        channel,
        null,
        uid
      );
      console.log('Successfully joined channel');

      // Create and publish local tracks (mic and camera)
      console.log('Creating local audio and video tracks...');
      const tracks = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard",
        }),
        AgoraRTC.createCameraVideoTrack(),
      ]);
      
      localTracksRef.current.audioTrack = tracks[0];
      localTracksRef.current.videoTrack = tracks[1];

      // Monitor user speaking via volume level
      const checkUserVolume = setInterval(() => {
        try {
          if (localTracksRef.current.audioTrack) {
            const volume = localTracksRef.current.audioTrack.getVolumeLevel();
            setIsUserSpeaking(volume > 0.1); // Threshold for speaking detection
          } else {
            setIsUserSpeaking(false);
          }
        } catch (e) {
          // Track might be disposed, stop checking
          setIsUserSpeaking(false);
        }
      }, 100);
      
      // Store interval to clear later
      if (!volumeCheckIntervalRef.current) {
        volumeCheckIntervalRef.current = {};
      }
      volumeCheckIntervalRef.current.user = checkUserVolume;

      // Publish local tracks
      console.log('Publishing local audio and video tracks...');
      await client.publish([localTracksRef.current.audioTrack, localTracksRef.current.videoTrack]);
      console.log('Successfully published tracks');

      // Add initial question to conversation if provided
      if (initialQuestion) {
        addMessage('user', initialQuestion);
      }

      // Prepare greeting message
      const greetingMessage = initialQuestion 
        ? `The user asks: "${initialQuestion}". Please answer this question directly.`
        : "Kumusta. I am Attorney ACKAI, a Filipino human rights lawyer. I specialize in constitutional law, civil liberties, and human rights advocacy in the Philippines. How may I assist you today?";

      // Start Convo AI
      console.log('Starting Agora Conversational AI...');
      const agentConfig = {
        name: channel,
        properties: {
          channel: channel,
          agent_rtc_uid: "10001",
          remote_rtc_uids: ["10000"],
          idle_timeout: 300,
          idle_timeout_with_human: 300,
          enable_transcription: true,
          enable_storage: false,
          advanced_features: {
            enable_aivad: true,
            enable_mllm: false,
            enable_rtm: false,
          },
          asr: {
            language: "en-US",
          },
          llm: {
            url: "https://api.groq.com/openai/v1/chat/completions",
            api_key: config.GROQ_KEY,
            system_messages: [
              {
                role: "system",
                content: "You are Attorney ACKAI, the Philippines' first AI human rights lawyer. You are calm, knowledgeable, and speak naturally in Filipino or Taglish. You specialize in the 1987 Philippine Constitution Article III (Bill of Rights) and key human rights laws like RA 7438 (rights of arrested persons), RA 11313 (Safe Spaces Act), RA 10175 (Cybercrime Prevention), RA 9262 (VAWC), and RA 9995 (Anti-Photo and Video Voyeurism). Give clear, practical legal guidance in 2-3 key points. For each right, explain it briefly and provide exact phrases the person can say to assert their rights. Keep responses conversational, empowering, and grounded in Philippine law. Help citizens understand and assert their rights in situations involving arrests, harassment, abuse, detention, cybercrime, and gender-based threats. IMPORTANT: Do NOT use markdown formatting like asterisks, dashes, or numbered lists. Speak naturally in plain text as if you're having a spoken conversation. Avoid using special characters."
              }
            ],
            greeting_message: greetingMessage,
            failure_message: "Sorry, I'm having technical difficulties. Please try speaking again.",
            params: {
              model: "llama-3.3-70b-versatile",
              temperature: 0.7,
              max_tokens: 500,
              top_p: 0.9
            }
          },
          tts: {
            vendor: "minimax",
            params: {
              url: "wss://api.minimax.io/ws/v1/t2a_v2",
              group_id: config.TTS_MINIMAX_GROUPID,
              key: config.TTS_MINIMAX_KEY,
              model: "speech-2.6-turbo",
              voice_setting: {
                voice_id: "English_Lively_Male_11",
                speed: 1,
                vol: 1,
                pitch: 0,
                emotion: "happy",
              },
              audio_setting: {
                sample_rate: 16000,
              },
            },
          },
        },
      };

      const response = await apiService.startConvoAI(agentConfig);
      
      if (response.agent_id) {
        setAgentId(response.agent_id);
        setIsConnected(true);
        console.log('Convo AI started successfully:', response.agent_id);
      } else {
        throw new Error('Failed to start AI agent');
      }

    } catch (err) {
      console.error('Failed to start call:', err);
      setError(err.message || 'Failed to start call');
      
      // Cleanup on error
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.close();
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.close();
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, addMessage, handleUserPublished, handleUserUnpublished, handleUserLeft, isConnected, isLoading]);

  // End call
  const endCall = useCallback(async () => {
    if (!isConnected && !agentId) {
      console.log('No active call to end');
      return;
    }

    setIsLoading(true);
    
    try {
      // Clear volume check intervals
      if (volumeCheckIntervalRef.current) {
        if (volumeCheckIntervalRef.current.ai) {
          clearInterval(volumeCheckIntervalRef.current.ai);
        }
        if (volumeCheckIntervalRef.current.user) {
          clearInterval(volumeCheckIntervalRef.current.user);
        }
        volumeCheckIntervalRef.current = null;
      }
      
      // Reset speaking states
      setIsAISpeaking(false);
      setIsUserSpeaking(false);
      
      // Stop AI agent
      if (agentId) {
        await apiService.stopConvoAI(agentId);
        console.log('Stopped AI agent:', agentId);
      }
      
      // Unpublish and close local tracks
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.stop();
        localTracksRef.current.audioTrack.close();
        localTracksRef.current.audioTrack = null;
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.stop();
        localTracksRef.current.videoTrack.close();
        localTracksRef.current.videoTrack = null;
      }
      
      // Leave channel if connected
      if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        await client.leave();
        console.log('Left RTC channel');
      }
      
      // Remove event listeners
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
      client.off("stream-message");
      
      setIsConnected(false);
      setAgentId(null);
      setChannelName('');
    } catch (err) {
      console.error('Failed to end call:', err);
      setError(err.message || 'Failed to end call');
    } finally {
      setIsLoading(false);
    }
  }, [agentId, client, handleUserPublished, handleUserUnpublished, handleUserLeft, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        endCall();
      }
    };
  }, []);

  return {
    isConnected,
    isLoading,
    conversation,
    channelName,
    error,
    startCall,
    endCall,
    clearConversation,
    addMessage,
    localTracksRef,
    isAISpeaking,
    isUserSpeaking
  };
}
