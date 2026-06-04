import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Header from './components/Header';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId && !isNewSession) {
      loadSessionMessages();
    }
  }, [currentSessionId, isNewSession]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        if (data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data[0].session_id);
          setIsNewSession(false);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadSessionMessages = async () => {
    if (!currentSessionId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${currentSessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setIsNewSession(true);
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    let sessionId = currentSessionId;

    if (isNewSession) {
      try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: message.substring(0, 50) })
        });
        if (response.ok) {
          const data = await response.json();
          sessionId = data.session_id;
          setCurrentSessionId(sessionId);
          setIsNewSession(false);
          setSessions([...sessions, data]);
        }
      } catch (error) {
        console.error('Error creating session:', error);
        return;
      }
    }

    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const error = await response.text();
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error}` }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await fetch(`${API_BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewSession();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsNewSession(false);
  };

  return (
    <div className="app-container">
      <Header onNewSession={handleNewSession} />
      <div className="app-content">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
        <ChatArea
          messages={messages}
          loading={loading}
          onSendMessage={handleSendMessage}
          isNewSession={isNewSession}
          sessionId={currentSessionId}
        />
      </div>
    </div>
  );
}

export default App;
