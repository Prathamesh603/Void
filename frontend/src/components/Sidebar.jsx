import React, { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({ sessions, currentSessionId, onSelectSession, onNewSession, onDeleteSession }) {
  const [hoveredSession, setHoveredSession] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="sidebar-new-btn" onClick={onNewSession} title="Create a new research session">
          <span>✎</span> New Chat
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sessions-list">
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">No sessions yet</p>
              <p className="empty-subtext">Start a new research session</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                className={`session-item ${currentSessionId === session.session_id ? 'active' : ''}`}
                onMouseEnter={() => setHoveredSession(session.session_id)}
                onMouseLeave={() => setHoveredSession(null)}
              >
                <button
                  className="session-button"
                  onClick={() => onSelectSession(session.session_id)}
                  title={session.title}
                >
                  <span className="session-icon">📄</span>
                  <span className="session-text">
                    <span className="session-title truncate">{session.title}</span>
                    <span className="session-date">{formatDate(session.created_at)}</span>
                  </span>
                </button>

                {hoveredSession === session.session_id && (
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this session?')) {
                        onDeleteSession(session.session_id);
                      }
                    }}
                    title="Delete session"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <p className="footer-text">Broq AI Research Agent</p>
        <p className="footer-version">v1.0.0</p>
      </div>
    </aside>
  );
}
