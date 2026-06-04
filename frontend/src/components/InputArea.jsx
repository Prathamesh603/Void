import React, { useState, useRef, useEffect } from 'react';
import './InputArea.css';

export default function InputArea({ onSendMessage, loading, isNewSession }) {
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState(3);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const height = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${height}px`;
    }
  };

  const handleSend = () => {
    if (message.trim() && !loading) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSend();
    }
  };

  const placeholder = isNewSession
    ? 'Start a research session... Ask me anything about papers, code, or research topics.'
    : 'Continue the conversation... Ask follow-up questions or explore new research areas.';

  return (
    <div className="input-area">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          rows={3}
        />
        <button
          className={`send-button ${loading ? 'loading' : ''}`}
          onClick={handleSend}
          disabled={loading || !message.trim()}
          title="Send message (Ctrl+Enter)"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Researching...</span>
            </>
          ) : (
            <>
              <span className="send-icon">→</span>
            </>
          )}
        </button>
      </div>
      <p className="input-hint">💡 Tip: Use Ctrl+Enter to send quickly</p>
    </div>
  );
}
