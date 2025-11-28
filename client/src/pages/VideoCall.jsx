import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConvoAI } from '../hooks/useConvoAI';
import './VideoCallOriginal.css';

function VideoCall() {
  const location = useLocation();
  const navigate = useNavigate();
  const { initialQuestion } = location.state || {};
  
  const {
    isConnected,
    isLoading,
    conversation,
    error,
    startCall,
    endCall,
    clearConversation,
    localTracksRef
  } = useConvoAI();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const conversationEndRef = useRef(null);

  // Play local video when connected
  useEffect(() => {
    if (isConnected && localTracksRef.current.videoTrack) {
      const localPlayer = document.getElementById('local-player');
      if (localPlayer) {
        try {
          localTracksRef.current.videoTrack.play(localPlayer);
          console.log('Local video playing successfully');
        } catch (error) {
          console.error('Error playing local video:', error);
        }
      } else {
        console.error('Local player element not found');
      }
    }
  }, [isConnected, localTracksRef]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Auto-start call if there's an initial question
  useEffect(() => {
    if (initialQuestion && !isConnected && !isLoading) {
      handleStart();
    }
  }, [initialQuestion]);

  const handleStart = async () => {
    try {
      await startCall(initialQuestion || null);
    } catch (err) {
      console.error('Failed to start:', err);
    }
  };

  const handleStop = async () => {
    try {
      await endCall();
      navigate('/');
    } catch (err) {
      console.error('Failed to stop:', err);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the conversation history?')) {
      clearConversation();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="video-call-container">
      {/* Floating Toggle Button */}
      {isConnected && (
        <button 
          className={`floating-toggle ${isSidebarOpen ? '' : 'closed'}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
        </button>
      )}

      {/* Start Screen */}
      {!isConnected && (
        <div className="start-screen active">
          <div className="start-content">
            <div className="logo-container">
              <div className="logo-icon">✨</div>
              <h1 className="app-title">How can I help you today?</h1>
              <p className="app-subtitle">
                {initialQuestion 
                  ? `I'll help you with: "${initialQuestion}"`
                  : "Start a conversation by clicking the button below. I'm here to assist you with any questions about Filipino human rights law."
                }
              </p>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            <button 
              onClick={handleStart} 
              className="main-start-btn"
              disabled={isLoading}
            >
              <span className="btn-icon">📞</span>
              <span className="btn-text">
                {isLoading ? 'Starting...' : 'Call Ackai'}
              </span>
            </button>

            <button 
              onClick={() => navigate('/')}
              className="back-btn"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Main View - Only shown when connected */}
      {isConnected && (
        <div className="main-view">
          {/* Conversation Sidebar */}
          <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3 className="sidebar-title">
                <i className="fas fa-comments"></i>
                <span>Conversation</span>
              </h3>
              {conversation.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="clear-btn"
                  title="Clear history"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>

            <div className="conversation-list" id="chat-messages">
              {conversation.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-comment-slash"></i>
                  <p>No messages yet</p>
                  <span>Start the conversation to see the transcript here</span>
                </div>
              ) : (
                conversation.map((message, index) => (
                  <div 
                    key={index}
                    className={`message ${message.role}`}
                  >
                    <div className="message-avatar">
                      {message.role === 'user' ? '👤' : '⚖️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="message-header">
                        <span className="message-role">
                          {message.role === 'user' ? 'You' : 'Attorney ACKAI'}
                        </span>
                        <span className="message-time">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="message-content">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={conversationEndRef} />
            </div>
          </div>

          {/* Video Main Area */}
          <div className="video-area">
            <div className="video-header">
              <div className="header-info">
                <div className="status-badge connected">
                  <span className="status-dot"></span>
                  Connected
                </div>
                <span className="channel-name">Attorney ACKAI</span>
              </div>
              <button 
                onClick={handleStop}
                className="stop-btn"
                disabled={isLoading}
              >
                <i className="fas fa-phone-slash"></i>
                End Call
              </button>
            </div>

            <div className="video-grid">
              <div className="video-box remote-video">
                <div className="video-placeholder">
                  <i className="fas fa-user-tie fa-4x"></i>
                  <p>Attorney ACKAI</p>
                  <div className="audio-indicator">
                    <i className="fas fa-volume-up"></i>
                    AI Speaking...
                  </div>
                </div>
              </div>
              
              <div className="video-box video-user">
                <div id="local-player" className="video-player"></div>
                <div className="video-label">
                  <span className="label-icon">👤</span>
                  <span>You</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCall;
