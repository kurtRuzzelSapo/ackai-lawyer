import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConvoAI } from '../hooks/useConvoAI';
import { jsPDF } from 'jspdf';
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
    localTracksRef,
    isAISpeaking,
    isUserSpeaking
  } = useConvoAI();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const conversationEndRef = useRef(null);
  const prevConversationLengthRef = useRef(0);

  // Track unread messages when sidebar is closed
  useEffect(() => {
    if (!isSidebarOpen && conversation.length > prevConversationLengthRef.current) {
      const newMessages = conversation.length - prevConversationLengthRef.current;
      setUnreadCount(prev => prev + newMessages);
    }
    prevConversationLengthRef.current = conversation.length;
  }, [conversation, isSidebarOpen]);

  // Reset unread count when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      setUnreadCount(0);
    }
  }, [isSidebarOpen]);

  // Keyboard shortcut to toggle sidebar (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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

  // Auto-start call if there's an initial question (only once)
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (initialQuestion && !isConnected && !isLoading && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleStart();
    }
  }, [initialQuestion, isConnected, isLoading]);

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
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    clearConversation();
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const toggleMute = async () => {
    if (localTracksRef.current.audioTrack) {
      try {
        const newMutedState = !isMuted;
        await localTracksRef.current.audioTrack.setEnabled(!newMutedState);
        setIsMuted(newMutedState);
        console.log(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFullDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleSaveAsPDF = () => {
    if (conversation.length === 0) {
      alert('No conversation to save!');
      return;
    }

    // Filter to ensure we have both user and assistant messages
    const validConversation = conversation.filter(msg => 
      msg && msg.content && msg.content.trim().length > 0 && 
      (msg.role === 'user' || msg.role === 'assistant')
    );

    if (validConversation.length === 0) {
      alert('No valid conversation to save!');
      return;
    }

    console.log('Original conversation:', conversation);
    console.log('Valid conversation (filtered):', validConversation);
    
    // Count messages by role
    const userCount = validConversation.filter(m => m.role === 'user').length;
    const aiCount = validConversation.filter(m => m.role === 'assistant').length;
    console.log(`Filtered: ${userCount} user messages, ${aiCount} AI messages`);

    // Use the valid conversation directly without aggressive merging
    // Only merge if content is EXACTLY the same
    const processedConversation = [];
    let lastMessage = null;

    validConversation.forEach((message) => {
      if (!lastMessage) {
        processedConversation.push({ ...message });
        lastMessage = message;
      } else if (lastMessage.role === message.role && lastMessage.content.trim() === message.content.trim()) {
        // Exact duplicate - skip it
        console.log('Skipping exact duplicate:', message.content.substring(0, 50));
      } else {
        // Different message - add it
        processedConversation.push({ ...message });
        lastMessage = message;
      }
    });
    
    console.log('Processed conversation (after removing exact duplicates):', processedConversation);
    
    // Final count
    const finalUserCount = processedConversation.filter(m => m.role === 'user').length;
    const finalAiCount = processedConversation.filter(m => m.role === 'assistant').length;
    console.log(`PDF will include ${finalUserCount} user messages and ${finalAiCount} AI messages`);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkAddPage = (requiredSpace = 10) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to wrap text
    const wrapText = (text, maxWidth) => {
      return doc.splitTextToSize(text, maxWidth);
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ACKAI Conversation Transcript', margin, yPosition);
    yPosition += 10;

    // Date and time
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const sessionDate = processedConversation[0]?.timestamp 
      ? formatFullDate(processedConversation[0].timestamp)
      : formatFullDate(new Date());
    doc.text(`Session Date: ${sessionDate}`, margin, yPosition);
    yPosition += 8;

    // Horizontal line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Summary stats
    const userMsgCount = processedConversation.filter(m => m.role === 'user').length;
    const aiMsgCount = processedConversation.filter(m => m.role === 'assistant').length;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Messages: ${processedConversation.length} (You: ${userMsgCount}, Attorney ACKAI: ${aiMsgCount})`, margin, yPosition);
    yPosition += 10;

    // Conversation messages
    processedConversation.forEach((message, index) => {
      checkAddPage(30);

      // Message header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      // Check both 'user' and 'assistant' roles
      if (message.role === 'user') {
        doc.setTextColor(37, 99, 235); // Blue
        doc.text('You', margin, yPosition);
      } else if (message.role === 'assistant') {
        doc.setTextColor(22, 163, 74); // Green
        doc.text('Attorney ACKAI', margin, yPosition);
      } else {
        // Fallback for any other role
        doc.setTextColor(22, 163, 74); // Green
        doc.text(`${message.role}`, margin, yPosition);
      }

      // Timestamp
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const time = formatTime(message.timestamp);
      doc.text(time, pageWidth - margin - doc.getTextWidth(time), yPosition);
      yPosition += 6;

      // Message content - clean up and format
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      // Clean up the content: remove extra spaces, ensure proper sentence structure
      let cleanContent = message.content
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\s+\./g, '.') // Remove space before period
        .replace(/\.\s*\./g, '.') // Remove duplicate periods
        .trim();
      
      const wrappedText = wrapText(cleanContent, maxWidth);
      
      wrappedText.forEach((line) => {
        checkAddPage(lineHeight);
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      yPosition += 5; // Space between messages

      // Separator line for each message
      if (index < processedConversation.length - 1) {
        checkAddPage(5);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
      }
    });

    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'Generated by ACKAI - AI Citizen Knowledge & Advisory Interface',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Generate filename with date
    const filename = `ACKAI_Transcript_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    console.log('PDF saved successfully!');
  };

  return (
    <div className="video-call-container">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <i className="fas fa-exclamation-triangle modal-icon"></i>
              <h3>Clear Conversation History?</h3>
            </div>
            <p className="modal-message">
              Are you sure you want to delete all conversation messages? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={cancelDelete}>
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button className="modal-btn delete-btn" onClick={confirmDelete}>
                <i className="fas fa-trash"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
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
              <div className="sidebar-actions">
                <button 
                  className="mobile-toggle-btn"
                  onClick={() => setIsSidebarOpen(false)}
                  title="Hide conversation"
                  aria-label="Hide sidebar"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <h3 className="sidebar-title">
                <i className="fas fa-comments"></i>
                <span>Conversation</span>
              </h3>
              <div className="sidebar-actions-right">
                {conversation.length > 0 && (
                  <>
                    <button 
                      onClick={handleSaveAsPDF}
                      className="save-pdf-btn"
                      title="Save as PDF"
                    >
                      <i className="fas fa-file-pdf"></i>
                    </button>
                    <button 
                      onClick={handleClearHistory}
                      className="clear-btn"
                      title="Clear history"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </>
                )}
              </div>
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
                <button 
                  className="sidebar-toggle-btn"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  title={isSidebarOpen ? 'Hide conversation' : 'Show conversation'}
                  aria-label={isSidebarOpen ? 'Hide conversation sidebar' : 'Show conversation sidebar'}
                >
                  <i className={`fas ${isSidebarOpen ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                  {!isSidebarOpen && unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                <div className="status-badge connected">
                  <span className="status-dot"></span>
                  Connected
                </div>
                <span className="channel-name">Attorney ACKAI</span>
              </div>
              <div className="header-controls">
                <button 
                  onClick={toggleMute}
                  className={`control-btn ${isMuted ? 'muted' : ''}`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                <button 
                  onClick={handleStop}
                  className="stop-btn"
                  disabled={isLoading}
                >
                  <i className="fas fa-phone-slash"></i>
                  End Call
                </button>
              </div>
            </div>

            <div className="video-grid">
              <div className="video-box remote-video">
                <div className="video-placeholder">
                  <i className="fas fa-user-tie fa-4x"></i>
                  <p>Attorney ACKAI</p>
                  {isAISpeaking && (
                    <div className="audio-indicator active">
                      <div className="wave-bars">
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                      </div>
                      <span className="indicator-text">AI Speaking...</span>
                    </div>
                  )}
                  {!isAISpeaking && (
                    <div className="audio-indicator">
                      <i className="fas fa-volume-up"></i>
                      Listening...
                    </div>
                  )}
                </div>
              </div>
              
              <div className="video-box video-user">
                <div id="local-player" className="video-player"></div>
                <div className="video-label">
                  <span className="label-icon">👤</span>
                  <span>You</span>
                </div>
                {isUserSpeaking && (
                  <div className="user-speaking-indicator">
                    <div className="wave-bars small">
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                    </div>
                    <span>Speaking...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCall;
