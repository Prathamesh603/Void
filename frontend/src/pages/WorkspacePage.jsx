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
import { WORKSPACE_QUOTES } from '../lib/constants';

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
    return localStorage.getItem('techshodh_theme') || 'light';
  });

  const [ready, setReady] = useState(false);
  const [switchingSession, setSwitchingSession] = useState(false);
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
    localStorage.setItem('techshodh_theme', theme);
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

    (async () => {
      setSwitchingSession(true);
      try {
        await Promise.all([
          loadMessages(currentSessionId),
          refreshPapers(currentSessionId),
        ]);
        const s = sessions.find((x) => x.session_id === currentSessionId);
        if (s) setSessionName(s.session_name);
      } catch (e) {
        console.error("Error loading session:", e);
      } finally {
        setSwitchingSession(false);
      }
    })();
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

    // Set loading and user message immediately to prevent double submissions and hide suggestions
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);

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
        setLoading(false);
        return;
      }
    }

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
      try {
        const blobUrl = await fetchPdfBlob(paper.paper_id);
        setPaperView({
          mode: 'pdf',
          paper,
          pdfUrl: blobUrl,
        });
      } catch (blobErr) {
        console.warn("fetchPdfBlob failed, falling back to direct pdf_url:", blobErr);
        setPaperView({
          mode: 'pdf',
          paper,
          pdfUrl: paper.pdf_url,
        });
      }
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

      const res = await sendChat(currentSessionId, enrichedMessage, `📄 [Paper Query] ${query}`);
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
      <div className="flex h-screen flex-col items-center justify-center bg-background text-neutral-500 transition-colors duration-300">
        <span className="font-display italic text-2xl text-ink mb-6">Techshodh</span>
        <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
        <p className="mt-4 font-deva text-sm text-neutral-400">विद्या ददाति विनयम्</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="workspace-shell relative flex h-screen flex-col font-sans transition-colors duration-300"
    >
      <header className="workspace-header relative z-20 flex h-14 shrink-0 items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-normal tracking-tight text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg font-display italic text-base shadow-sm">
              <img src="/favicon.png"></img>
            </span>
            <span className="italic">Techshodh</span>
          </Link>
          <span className="hidden h-4 w-px bg-neutral-300 dark:bg-white/15 sm:block" />
          <span className="hidden font-deva text-sm text-neutral-500 sm:inline">
            ✦ शोध · Research Agent ✦
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full p-2 text-neutral-500 hover:bg-white/60 dark:hover:bg-white/10 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 transition hover:text-neutral-900 dark:hover:text-neutral-200 hover:shadow-sm"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      {currentUser && (
        <PanelGroup direction="horizontal" className="relative flex-1 min-h-0">
          <div className="workspace-ambient" aria-hidden="true" />
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

          <PanelResizeHandle className="relative z-10 w-px bg-neutral-200/60 dark:bg-white/10 hover:bg-neutral-400/50 dark:hover:bg-white/20 transition-colors" />

          <Panel defaultSize={52} minSize={35}>
            <ChatPanel
              messages={messages}
              loading={loading}
              switchingSession={switchingSession}
              isNewSession={isNewSession}
              onSend={handleSend}
              sessionName={sessionName}
            />
          </Panel>

          <PanelResizeHandle className="relative z-10 w-px bg-neutral-200/60 dark:bg-white/10 hover:bg-neutral-400/50 dark:hover:bg-white/20 transition-colors" />

          <Panel defaultSize={30} minSize={20} maxSize={45}>
            <PapersPanel
              papers={papers}
              downloadedIds={downloadedIds}
              switchingSession={switchingSession}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className={`relative w-full overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-white/10 bg-background text-ink shadow-2xl shadow-neutral-900/10 transition-all duration-300 ${userModalMode === 'login' ? 'max-w-3xl md:max-w-4xl grid grid-cols-1 md:grid-cols-12' : 'max-w-md p-8 bg-white dark:bg-void-900'
            }`}>

            {userModalMode === 'login' && (
              <div className="col-span-6 relative hidden md:flex flex-col min-h-[550px] bg-[#faf6f0] overflow-hidden">

                {/* Background Glow */}
                <div className="absolute inset-0 ambient-glow-bg-strong z-0 pointer-events-none" />

                {/* IMAGE ZONE (fixed layout, no overlap) */}
                <div className="relative z-[2] h-[320px] flex items-center justify-center pt-6">
                  <div className="relative">
                    {/* soft light behind image */}
                    <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full scale-110" />

                    <img
                      src="/Namaste.png"
                      alt="Namaste — welcome to Techshodh"
                      className="relative h-[280px] w-auto object-contain drop-shadow-lg"
                    />
                  </div>
                </div>

                {/* Decorative Arc */}
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[32%] rajshahi-arc border-t border-neutral-300/20 z-[1]" />

                {/* TEXT ZONE */}
                <div className="relative z-10 px-10 pb-1 pt-10  0 flex flex-col gap-4">

                  <span className="font-deva text-sm text-neutral-800 flex items-center gap-2">
                    <span>✦</span>
                    <span>{WORKSPACE_QUOTES[0].deva}</span>
                    <span>✦</span>
                  </span>

                  <h4 className="font-display text-3xl font-normal tracking-tight text-neutral-900 leading-tight">
                    Begin your <em className="italic text-neutral-900">शोध.</em>
                  </h4>

                  <p className="text-sm text-neutral-800 mt-1 max-w-xs leading-relaxed font-sans">
                    {WORKSPACE_QUOTES[0].gloss} — Bharat&apos;s research agent, grounded in papers you trust.
                  </p>
                </div>

              </div>
            )}

            <div className={userModalMode === 'login' ? 'col-span-6 p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-void-900' : ''}>
              {userModalMode === 'manage' && (
                <button
                  type="button"
                  onClick={() => setUserModalMode(null)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-800 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <div className="text-center mb-6">
                {userModalMode !== 'login' && (
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-foreground text-background font-display italic text-lg shadow-sm mb-3">
                    <img src="favicon.png"></img>
                  </span>
                )}
                <h3 className="font-display text-2xl font-normal tracking-tight text-ink dark:text-neutral-100">
                  {userModalMode === 'login' ? 'Welcome to Techshodh' : 'Account'}
                </h3>
                <p className="text-xs text-neutral-500 mt-1.5 font-deva">
                  तेजस्वि नावधीतमस्तु
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Your AI Research Agent · Grounded in papers you trust.
                </p>
              </div>

              {userModalMode === 'manage' ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-950 p-4 text-center">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {currentUser?.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 py-3 text-sm font-semibold text-red-600 dark:text-red-400 transition"
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
                      className={`flex-1 pb-3 text-sm font-medium transition ${modalTab === 'signin'
                        ? 'border-b-2 border-foreground text-ink dark:text-neutral-100'
                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                        }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalTab('create'); setModalError(''); }}
                      className={`flex-1 pb-3 text-sm font-medium transition ${modalTab === 'create'
                        ? 'border-b-2 border-foreground text-ink dark:text-neutral-100'
                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                        }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {modalError && (
                    <div className="mb-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                      {modalError}
                    </div>
                  )}

                  {modalTab === 'signin' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-950 px-4 py-3 text-sm text-ink dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-white/25 focus:ring-2 focus:ring-neutral-200/50 dark:focus:ring-white/5 transition duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          autoComplete="current-password"
                          placeholder="Your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-950 px-4 py-3 text-sm text-ink dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-white/25 focus:ring-2 focus:ring-neutral-200/50 dark:focus:ring-white/5 transition duration-200"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full workspace-btn-primary py-3 text-sm font-semibold shadow-sm hover:scale-[1.01] transition disabled:opacity-60"
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-950 px-4 py-3 text-sm text-ink dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-white/25 focus:ring-2 focus:ring-neutral-200/50 dark:focus:ring-white/5 transition duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-950 px-4 py-3 text-sm text-ink dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-white/25 focus:ring-2 focus:ring-neutral-200/50 dark:focus:ring-white/5 transition duration-200"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full workspace-btn-primary py-3 text-sm font-semibold shadow-sm hover:scale-[1.01] transition disabled:opacity-60"
                      >
                        {loading ? 'Creating account...' : 'Create Account'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </motion.div>
  );
}
