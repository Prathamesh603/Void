import React from 'react';
import './Header.css';

export default function Header({ onNewSession }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <h1>Broq AI</h1>
          </div>
          <p className="tagline">Research Agent</p>
        </div>

        <button className="new-session-btn" onClick={onNewSession} title="Start new research session">
          <span className="btn-icon">+</span>
          New Session
        </button>
      </div>
    </header>
  );
}
