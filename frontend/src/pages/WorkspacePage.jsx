import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Home, Loader2, Sun, Moon, X } from 'lucide-react';
import ChatHistoryPanel from '../components/workspace/ChatHistoryPanel';
import ChatPanel from '../components/workspace/ChatPanel';
import PapersPanel from '../components/workspace/PapersPanel';
import {
  createSession,
  deleteSession,
  downloadPdf,
  fetchPdfBlob,
  getMessages,
  listPdfs,
  listSessions,
  queryPdf,
  sendChat,
  getPapers,
  getCurrentUser,
  getAuthToken,
  setCurrentUser as setApiUser,
  clearAuth,
  login,
  register,
  fetchCurrentUser,
} from '../lib/api';

export default function WorkspacePage() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [userModalMode, setUserModalMode] = useState(
    !getAuthToken() ? 'login' : null
  );
  const [modalTab, setModalTab] = useState('signin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
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

  const handleLoginSuccess = async (userObj) => {
    setApiUser(userObj);
    setCurrentUser(userObj);
    setUserModalMode(null);
    setModalError('');
    setLoginEmail('');
    setLoginPassword('');
    setRegisterEmail('');
    setRegisterPassword('');

    setReady(false);
    try {
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;

    try {
      setLoading(true);
      setModalError('');
      const data = await login(loginEmail.trim(), loginPassword);
      await handleLoginSuccess({ user_id: data.user_id, email: data.email });
    } catch (err) {
      setModalError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerEmail.trim() || !registerPassword) return;

    if (registerPassword.length < 8) {
      setModalError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      setModalError('');
      const data = await register(registerEmail.trim(), registerPassword);
      await handleLoginSuccess({ user_id: data.user_id, email: data.email });
    } catch (err) {
      setModalError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setSessions([]);
    setMessages([]);
    setPapers([]);
    setDownloadedIds(new Set());
    setUserModalMode('login');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('void_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!getAuthToken()) {
      setReady(true);
      return;
    }

    (async () => {
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
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
        clearAuth();
        setCurrentUser(null);
        setUserModalMode('login');
      } finally {
        setReady(true);
      }
    })();
  }, [routeSessionId, refreshSessions, loadMessages, refreshPapers]);

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

    setMessages((prev) => [...prev, { role: 'user', content: `📄 [Paper Query] ${query}` }]);
    setLoading(true);

    try {
      const ragResult = await queryPdf(currentSessionId, query, paperId);
      const chunks = ragResult.chunks || [];

      const context = chunks.length > 0
        ? chunks.map((c, i) => `[Excerpt ${i + 1}] (Page ${c.page}): ${c.content}`).join('\n\n')
        : 'No relevant excerpts found in the paper.';

      const enrichedMessage = `IMPORTANT: Do NOT use any tools. Answer ONLY from the excerpts below.\n\nThe user is asking about the paper "${paperTitle}".\n\nRelevant excerpts from the paper:\n${context}\n\nUser question: ${query}\n\nPlease provide a clear, well-structured answer based ONLY on the paper excerpts above. Do not search for new papers.`;

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

      {currentUser && (
        <PanelGroup direction="horizontal" className="flex-1 min-h-0">
          <Panel defaultSize={18} minSize={14} maxSize={28}>
            <ChatHistoryPanel
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelect={handleSelectSession}
              onNew={handleNewChat}
              onDelete={handleDeleteSession}
              currentUser={currentUser}
              onLogout={() => setUserModalMode('manage')}
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
      )}

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
                {userModalMode === 'login' ? 'Welcome to Void' : 'Account'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Your AI Research Agent · Grounded in papers you trust.
              </p>
            </div>

            {userModalMode === 'manage' ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 p-4 text-center">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {currentUser?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 py-3 text-sm font-semibold text-red-600 dark:text-red-400 transition"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
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
                    Create Account
                  </button>
                </div>

                {modalError && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    {modalError}
                  </div>
                )}

                {modalTab === 'signin' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="Your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl void-gradient-bg py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:scale-[1.01] transition disabled:opacity-60"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl void-gradient-bg py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:scale-[1.01] transition disabled:opacity-60"
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
