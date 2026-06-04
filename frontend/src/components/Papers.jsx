import React, { useState, useEffect } from 'react';
import './Papers.css';

export default function Papers({ sessionId }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    if (sessionId) {
      loadPapers();
    }
  }, [sessionId]);

  const loadPapers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/papers/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setPapers(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load papers');
      }
    } catch (err) {
      setError('Error loading papers: ' + err.message);
      console.error('Error loading papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paper) => {
    try {
      // Trigger PDF download if available
      if (paper.pdf_url) {
        window.open(paper.pdf_url, '_blank');
      }
    } catch (err) {
      console.error('Error downloading paper:', err);
    }
  };

  const handleDelete = async (paperId) => {
    if (window.confirm('Delete this paper?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/paper/${paperId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setPapers(papers.filter(p => p.paper_id !== paperId));
        }
      } catch (err) {
        console.error('Error deleting paper:', err);
      }
    }
  };

  return (
    <div className="papers-container">
      {loading && (
        <div className="papers-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading research papers...</p>
        </div>
      )}

      {error && (
        <div className="papers-error">
          <p>{error}</p>
          <button onClick={loadPapers} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && papers.length === 0 && !error && (
        <div className="papers-empty">
          <div className="empty-icon">📄</div>
          <h3>No Research Papers Yet</h3>
          <p>Papers found in your research will appear here</p>
          <p className="empty-hint">Ask a research question to discover relevant papers</p>
        </div>
      )}

      {papers.length > 0 && (
        <div className="papers-list">
          <div className="papers-header">
            <h3>Research Papers ({papers.length})</h3>
          </div>
          
          {papers.map((paper, idx) => (
            <div key={idx} className="paper-card">
              <div className="paper-header">
                <h4 className="paper-title">{paper.title || 'Untitled'}</h4>
                <span className="paper-badge">
                  {paper.arxiv_id ? '🔬 ArXiv' : '📖 Paper'}
                </span>
              </div>

              <div className="paper-meta">
                {paper.authors && (
                  <p className="paper-authors">
                    <strong>Authors:</strong> {paper.authors}
                  </p>
                )}
                
                {paper.published_date && (
                  <p className="paper-date">
                    <strong>Published:</strong> {new Date(paper.published_date).toLocaleDateString()}
                  </p>
                )}

                {paper.arxiv_id && (
                  <p className="paper-arxiv">
                    <strong>ArXiv ID:</strong> <code>{paper.arxiv_id}</code>
                  </p>
                )}
              </div>

              {paper.summary && (
                <div className="paper-summary">
                  <p>{paper.summary.substring(0, 200)}...</p>
                </div>
              )}

              <div className="paper-actions">
                {paper.pdf_url && (
                  <button 
                    className="btn-primary"
                    onClick={() => handleDownload(paper)}
                    title="Download PDF"
                  >
                    📥 Download PDF
                  </button>
                )}
                
                <a 
                  href={`https://arxiv.org/abs/${paper.arxiv_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  title="View on ArXiv"
                >
                  🔗 View on ArXiv
                </a>

                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(paper.paper_id)}
                  title="Delete paper"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
