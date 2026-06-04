import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';
import Papers from './Papers';
import InputArea from './InputArea';
import './ChatArea.css';

export default function ChatArea({ messages, loading, onSendMessage, isNewSession, sessionId }) {
  const messagesEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('messages');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-area">
      {!isNewSession && (
        <div className="chat-tabs">
          <button 
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            💬 Messages
          </button>
          <button 
            className={`tab ${activeTab === 'papers' ? 'active' : ''}`}
            onClick={() => setActiveTab('papers')}
          >
            📄 Research Papers
          </button>
        </div>
      )}
      
      <div className="messages-container">
        {activeTab === 'messages' ? (
          <>
            {isNewSession && messages.length === 0 ? (
              <div className="welcome-container">
                <div className="welcome-content">
                  <h2>Welcome to Broq AI</h2>
                  <p className="welcome-subtitle">Your Research Intelligence Platform</p>
                  
                  <div className="feature-grid">
                    <div className="feature-card">
                      <span className="feature-icon">📚</span>
                      <h3>Research</h3>
                      <p>Search papers from ArXiv and academic databases</p>
                    </div>
                    
                    <div className="feature-card">
                      <span className="feature-icon">🔍</span>
                      <h3>Retrieval</h3>
                      <p>Find relevant information from your uploaded PDFs</p>
                    </div>
                    
                    <div className="feature-card">
                      <span className="feature-icon">📖</span>
                      <h3>Knowledge</h3>
                      <p>Access Wikipedia and web search capabilities</p>
                    </div>
                    
                    <div className="feature-card">
                      <span className="feature-icon">✨</span>
                      <h3>Intelligence</h3>
                      <p>AI-powered analysis and summarization</p>
                    </div>
                  </div>

                  <div className="suggestions">
                    <p className="suggestions-title">Try asking:</p>
                    <div className="suggestion-pills">
                      <button className="suggestion-pill" onClick={() => onSendMessage("What are the latest advances in transformers?")}>
                        Latest advances in transformers
                      </button>
                      <button className="suggestion-pill" onClick={() => onSendMessage("Explain attention mechanisms")}>
                        Explain attention mechanisms
                      </button>
                      <button className="suggestion-pill" onClick={() => onSendMessage("Compare BERT and GPT")}>
                        Compare BERT and GPT
                      </button>
                      <button className="suggestion-pill" onClick={() => onSendMessage("Summarize recent LLM research")}>
                        Recent LLM research
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg, idx) => (
                  <Message
                    key={idx}
                    message={msg.content}
                    isUser={msg.role === 'user'}
                  />
                ))}
                {loading && (
                  <div className="loading-message">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p>Researching and analyzing...</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </>
        ) : (
          <Papers sessionId={sessionId} />
        )}
      </div>

      <InputArea
        onSendMessage={onSendMessage}
        loading={loading}
        isNewSession={isNewSession}
      />
    </div>
  );
}
