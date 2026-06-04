import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Home, Loader2, Sun, Moon, X, User } from 'lucide-react';
import ChatHistoryPanel from '../components/workspace/ChatHistoryPanel';
import ChatPanel from '../components/workspace/ChatPanel';
import PapersPanel from '../components/workspace/PapersPanel';
import {
  createSession,
  deleteSession,
  downloadPdf,
  ensureUser,
  fetchPdfBlob,
  getMessages,
  listPdfs,
  listSessions,
  queryPdf,
  sendChat,
  getPapers,
  getCurrentUser,
  setCurrentUser as setApiUser,
  createUser,
  listUsers,
} from '../lib/api';

export default function WorkspacePage() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [userModalMode, setUserModalMode] = useState(!getCurrentUser() ? 'login' : null);
  const [existingUsers, setExistingUsers] = useState([]);
  const [modalTab, setModalTab] = useState('signin');
  const [loginUserId, setLoginUserId] = useState('');
  const [registerUserId, setRegisterUserId] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [modalError, setModalError] = useState('');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('void_theme') || 'dark';
  });

  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(routeSessionId || null);
  const [isNewSession, setIsNewSession] = useState(!routeSessionId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionName, setSessionName] = useState('');

  const [papers, setPapers] = useState([]);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [paperView, setPaperView] = useState({ mode: 'list', paper: null, pdfUrl: null });
  const [loadingPaperId, setLoadingPaperId] = useState(null);
  const [paperError, setPaperError] = useState(null);

  const refreshSessions = useCallback(async () => {
    const data = await listSessions();
    setSessions(data);
    return data;
  }, []);

  const refreshPapers = useCallback(async (sessionId) => {
    if (!sessionId) {
      setPapers([]);
      setDownloadedIds(new Set());
      return;
    }
    try {
      const [papersRes, pdfsRes] = await Promise.all([
        getPapers(sessionId),
        listPdfs(sessionId).catch(() => ({ pdfs: [] })),
      ]);
      setPapers(papersRes.papers || []);
      const ids = new Set((pdfsRes.pdfs || []).map((p) => p.pdf_id));
      setDownloadedIds(ids);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadMessages = useCallback(async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    const data = await getMessages(sessionId);
    setMessages(data);
  }, []);

  const loadExistingUsers = useCallback(async () => {
    try {
      const data = await listUsers();
      setExistingUsers(data || []);
    } catch (e) {
      console.error('Failed to list users:', e);
    }
  }, []);

  const handleLoginSuccess = async (userObj) => {
    setApiUser(userObj);
    setCurrentUser(userObj);
    setUserModalMode(null);
    setModalError('');
    setLoginUserId('');
    setRegisterUserId('');
    setRegisterEmail('');
    
    setReady(false);
    try {
      await ensureUser();
      const data = await refreshSessions();
      if (data.length > 0) {
        handleSelectSession(data[0].session_id);
      } else {
        handleNewChat();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReady(true);
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!loginUserId.trim()) return;
    
    const matched = existingUsers.find(
      (u) => u.user_id.toLowerCase() === loginUserId.trim().toLowerCase()
    );
    if (matched) {
      handleLoginSuccess(matched);
    } else {
      setModalError('User ID not found. Please check spelling or Create Account.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerUserId.trim() || !registerEmail.trim()) return;
    
    try {
      setLoading(true);
      await createUser(registerUserId.trim(), registerEmail.trim());
      await loadExistingUsers();
      handleLoginSuccess({ user_id: registerUserId.trim(), email: registerEmail.trim() });
    } catch (err) {
      setModalError(err.message || 'Failed to create user. It may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setApiUser(null);
    setCurrentUser(null);
    setSessions([]);
    setMessages([]);
    setPapers([]);
    setDownloadedIds(new Set());
    setUserModalMode('login');
  };

  useEffect(() => {
    loadExistingUsers();
  }, [loadExistingUsers]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('void_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!currentUser) {
      setReady(true);
      return;
    }
    (async () => {
      try {
        await ensureUser();
        const data = await refreshSessions();
        if (routeSessionId) {
          setCurrentSessionId(routeSessionId);
          setIsNewSession(false);
          const s = data.find((x) => x.session_id === routeSessionId);
          setSessionName(s?.session_name || '');
          await loadMessages(routeSessionId);
          await refreshPapers(routeSessionId);
        }
      } catch (e) {
        console.error('Init failed:', e);
      } finally {
        setReady(true);
      }
    })();
  }, [routeSessionId, currentUser, refreshSessions, loadMessages, refreshPapers]);

  useEffect(() => {
    if (!currentSessionId || isNewSession) return;
    loadMessages(currentSessionId);
    refreshPapers(currentSessionId);
    const s = sessions.find((x) => x.session_id === currentSessionId);
    if (s) setSessionName(s.session_name);
  }, [currentSessionId, isNewSession]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setIsNewSession(true);
    setMessages([]);
    setSessionName('');
    setPapers([]);
    setDownloadedIds(new Set());
    setPaperView({ mode: 'list', paper: null, pdfUrl: null });
    navigate('/app');
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    setIsNewSession(false);
    setPaperView({ mode: 'list', paper: null, pdfUrl: null });
    navigate(`/app/${id}`);
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteSession(id);
      const data = await refreshSessions();
      if (currentSessionId === id) {
        if (data.length > 0) {
          handleSelectSession(data[0].session_id);
        } else {
          handleNewChat();
        }
      } else {
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (message) => {
    if (!message.trim() || loading) return;

    let sessionId = currentSessionId;

    if (isNewSession || !sessionId) {
      try {
        const title = message.substring(0, 50) || 'New research';
        const session = await createSession(title);
        sessionId = session.session_id;
        setCurrentSessionId(sessionId);
        setIsNewSession(false);
        setSessionName(session.session_name);
        const updated = await refreshSessions();
        setSessions(updated);
        navigate(`/app/${sessionId}`, { replace: true });
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Could not create session: ${e.message}` },
        ]);
        return;
      }
    }

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const res = await sendChat(sessionId, message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.response,
          tools_used: res.tools_used,
        },
      ]);
      await refreshPapers(sessionId);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaper = async (paper) => {
    if (!currentSessionId || loadingPaperId) return;
    setPaperError(null);
    setLoadingPaperId(paper.paper_id);
    setPaperView({ mode: 'pdf', paper, pdfUrl: null });

    try {
      if (!downloadedIds.has(paper.paper_id)) {
        await downloadPdf({
          session_id: currentSessionId,
          paper_id: paper.paper_id,
          arxiv_id: paper.arxiv_id,
          pdf_url: paper.pdf_url,
          title: paper.title,
        });
        await refreshPapers(currentSessionId);
      }
      // Fetch PDF as blob for inline rendering (avoids download)
      const blobUrl = await fetchPdfBlob(paper.paper_id);
      setPaperView({
        mode: 'pdf',
        paper,
        pdfUrl: blobUrl,
      });
    } catch (e) {
      setPaperError(e.message);
      setPaperView({ mode: 'list', paper: null, pdfUrl: null });
    } finally {
      setLoadingPaperId(null);
    }
  };

  const handlePdfQuery = async (query) => {
    if (!query.trim() || !currentSessionId || !paperView.paper || loading) return;

    const paperTitle = paperView.paper.title;
    const paperId = paperView.paper.paper_id;

    // Show user query in chat
    setMessages((prev) => [...prev, { role: 'user', content: `📄 [Paper Query] ${query}` }]);
    setLoading(true);

    try {
      // 1. Retrieve relevant chunks from the PDF via RAG
      const ragResult = await queryPdf(currentSessionId, query, paperId);
      const chunks = ragResult.chunks || [];

      // 2. Build enriched prompt with context
      const context = chunks.length > 0
        ? chunks.map((c, i) => `[Excerpt ${i + 1}] (Page ${c.page}): ${c.content}`).join('\n\n')
        : 'No relevant excerpts found in the paper.';

      const enrichedMessage = `The user is asking about the paper "${paperTitle}".\n\nRelevant excerpts from the paper:\n${context}\n\nUser question: ${query}\n\nPlease provide a clear, well-structured answer based on the paper excerpts above.`;

      // 3. Send to LLM via chat
      const res = await sendChat(currentSessionId, enrichedMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.response,
          tools_used: res.tools_used,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error querying paper: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPapers = () => {
    // Revoke blob URL to free memory
    if (paperView.pdfUrl && paperView.pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(paperView.pdfUrl);
    }
    setPaperView({ mode: 'list', paper: null, pdfUrl: null });
    setPaperError(null);
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-void-950 text-neutral-500 dark:text-neutral-400 transition-colors duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen flex-col bg-[#fafafa] dark:bg-void-950 text-neutral-900 dark:text-neutral-200 transition-colors duration-300 font-sans"
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0a0a0b] px-4 transition-colors duration-300">
        <div className="flex items-center gap-3 font-display">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white transition"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white text-base font-bold shadow-md border border-neutral-800"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              V
            </span>
            <span className="italic font-semibold text-xl leading-none">Void</span>
          </Link>
          <span className="hidden text-neutral-300 dark:text-neutral-700 sm:inline">|</span>
          <span className="hidden text-xs text-neutral-400 dark:text-neutral-500 sm:inline">
            Your Research Agent
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        <Panel defaultSize={18} minSize={14} maxSize={28}>
          <ChatHistoryPanel
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelect={handleSelectSession}
            onNew={handleNewChat}
            onDelete={handleDeleteSession}
            currentUser={currentUser}
            onSwitchUser={() => setUserModalMode('manage')}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-white/10 hover:bg-indigo-500/50 dark:hover:bg-indigo-500/50 transition-colors" />

        <Panel defaultSize={52} minSize={35}>
          <ChatPanel
            messages={messages}
            loading={loading}
            isNewSession={isNewSession}
            onSend={handleSend}
            sessionName={sessionName}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-neutral-200 dark:bg-white/10 hover:bg-indigo-500/50 dark:hover:bg-indigo-500/50 transition-colors" />

        <Panel defaultSize={30} minSize={20} maxSize={45}>
          <PapersPanel
            papers={papers}
            downloadedIds={downloadedIds}
            viewMode={paperView.mode}
            activePaper={paperView.paper}
            pdfUrl={paperView.pdfUrl}
            loadingPaperId={loadingPaperId}
            onSelectPaper={handleSelectPaper}
            onBack={handleBackToPapers}
            onQueryPdf={handlePdfQuery}
            queryLoading={loading}
            error={paperError}
          />
        </Panel>
      </PanelGroup>

      {userModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-void-950 p-8 shadow-2xl transition-colors duration-300">
            {userModalMode === 'manage' && (
              <button
                type="button"
                onClick={() => setUserModalMode(null)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="text-center mb-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white text-2xl font-bold shadow-md border border-neutral-800 font-display mb-3"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                V
              </span>
              <h3 className="text-2xl font-display font-semibold tracking-tight text-neutral-900 dark:text-white">
                {userModalMode === 'login' ? 'Welcome to Void' : 'Manage Profiles'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Your AI Research Agent · Grounded in papers you trust.
              </p>
            </div>

            <div className="flex border-b border-neutral-200 dark:border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setModalTab('signin'); setModalError(''); }}
                className={`flex-1 pb-3 text-sm font-medium transition ${
                  modalTab === 'signin'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setModalTab('create'); setModalError(''); }}
                className={`flex-1 pb-3 text-sm font-medium transition ${
                  modalTab === 'create'
                    ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                Create Profile
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                {modalError}
              </div>
            )}

            {modalTab === 'signin' ? (
              <div className="space-y-6">
                <form onSubmit={handleCustomLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Enter User ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. quantum_researcher"
                      value={loginUserId}
                      onChange={(e) => setLoginUserId(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl void-gradient-bg py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:scale-[1.01] transition"
                  >
                    Enter Workspace
                  </button>
                </form>

                {existingUsers.length > 0 && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                      Existing Profiles
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {existingUsers.map((u) => (
                        <button
                          key={u.user_id}
                          type="button"
                          onClick={() => handleLoginSuccess(u)}
                          className="flex w-full items-center justify-between rounded-xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/5 px-4 py-2.5 text-left hover:border-indigo-500/35 hover:bg-neutral-100 dark:hover:bg-white/10 transition"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                              {u.user_id}
                            </p>
                            <p className="truncate text-[10px] text-neutral-500">
                              {u.email}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full font-display">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {userModalMode === 'manage' && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 py-3 text-sm font-semibold text-red-600 dark:text-red-400 transition"
                  >
                    Logout current user
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    User ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jdoe"
                    value={registerUserId}
                    onChange={(e) => setRegisterUserId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl void-gradient-bg py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:scale-[1.01] transition"
                >
                  Create & Login
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
