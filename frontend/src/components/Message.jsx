import React from 'react';
import './Message.css';

export default function Message({ message, isUser }) {
  const formatMessage = (text) => {
    // Simple markdown-like formatting
    return text
      .split('\n\n')
      .map((paragraph, idx) => {
        // Check for code blocks
        if (paragraph.startsWith('```')) {
          const [, language, ...code] = paragraph.split('\n');
          return (
            <pre key={idx} className="code-block">
              <code>{code.join('\n')}</code>
            </pre>
          );
        }

        // Check for lists
        if (paragraph.includes('- ') || paragraph.includes('• ')) {
          const items = paragraph.split('\n').filter(line => line.trim());
          return (
            <ul key={idx} className="message-list">
              {items.map((item, itemIdx) => (
                <li key={itemIdx}>{item.replace(/^[-•]\s*/, '')}</li>
              ))}
            </ul>
          );
        }

        // Check for bold text
        let formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

        return (
          <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      });
  };

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <span className="user-avatar">👤</span> : <span className="assistant-avatar">🤖</span>}
      </div>
      <div className="message-content">
        <div className={`message-text ${isUser ? 'user-text' : 'assistant-text'}`}>
          {typeof message === 'string' ? formatMessage(message) : message}
        </div>
      </div>
    </div>
  );
}
