import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


const suggestions = [
  'Find recent papers on transformer architectures',
  'Summarize trends in physics-informed neural networks',
  'What are the latest advances in RAG for research?',
];

export default function ChatPanel({
  messages,
  loading,
  switchingSession,
  isNewSession,
  onSend,
  sessionName,
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submit = (text) => {
    const msg = (text || input).trim();
    if (!msg || loading || switchingSession) return;
    setInput('');
    onSend(msg);
  };

  return (
    <div className="relative flex h-full flex-col bg-white dark:bg-void-950 transition-colors duration-300 overflow-hidden">

      {/* Panel-wide ambient glow — pointer-events-none, doesn't affect layout */}
      <div className="pointer-events-none absolute -inset-4 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-400/20 blur-3xl opacity-40" />
      <div className="pointer-events-none absolute -inset-2 rounded-2xl bg-indigo-500/10 blur-2xl opacity-50" />

      {/* Header */}
      <div className="relative z-10 border-b border-neutral-200 dark:border-white/10 px-5 py-3 bg-white/80 dark:bg-void-950/80 backdrop-blur-sm transition-colors">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-300 font-display">Chat</h2>
        {sessionName && (
          <p className="truncate text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-display tracking-wide">{sessionName}</p>
        )}
      </div>

      {/* Messages — flex-1 scrollable, no layout shift */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {switchingSession ? (
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Assistant Skeleton */}
            <div className="flex justify-start">
              <div className="w-[60%] rounded-2xl px-4 py-3 bg-white/60 dark:bg-white/[0.04] border border-neutral-200/70 dark:border-white/[0.07] animate-pulse space-y-2">
                <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6"></div>
                <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2"></div>
              </div>
            </div>

            {/* User Skeleton */}
            <div className="flex justify-end">
              <div className="w-[40%] rounded-2xl px-4 py-3 bg-indigo-600/30 dark:bg-indigo-900/30 border border-indigo-500/20 animate-pulse">
                <div className="h-3 bg-indigo-200/30 dark:bg-indigo-400/25 rounded w-2/3 ml-auto"></div>
              </div>
            </div>

            {/* Assistant Skeleton */}
            <div className="flex justify-start">
              <div className="w-[70%] rounded-2xl px-4 py-3 bg-white/60 dark:bg-white/[0.04] border border-neutral-200/70 dark:border-white/[0.07] animate-pulse space-y-2">
                <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6"></div>
                <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-xl text-center pt-12 md:pt-20"
          >
            <span className="text-4xl">👋</span>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-105 font-display">
              {isNewSession ? "Let's start your research" : 'Continue your research'}
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
              Ask Void to search papers, explain concepts, or dive into sources saved in this session.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  disabled={loading || switchingSession}
                  className="rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 hover:border-indigo-500/40 hover:text-neutral-900 dark:hover:text-neutral-200 transition font-sans disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={`${i}-${m.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-[1.65] bg-indigo-600/90 backdrop-blur-md text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/30'
                        : 'max-w-[92%] py-2 text-[15px] leading-[1.65] text-neutral-800 dark:text-neutral-200'
                    }
                  >
                    {m.role === 'assistant' ? (
                      <div className="markdown-body prose-invert prose-neutral max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="pre"
                                  className="rounded-lg my-3 overflow-hidden text-sm"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-neutral-200/50 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                    {m.tools_used?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 border-t border-neutral-200/50 dark:border-white/10 pt-2">
                        {m.tools_used.map((t) => (
                          <span
                            key={t.tool_name}
                            className="rounded-md bg-neutral-200/50 dark:bg-white/10 px-2 py-0.5 text-[10px] tracking-wide text-neutral-500 dark:text-neutral-400"
                          >
                            {t.tool_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 pl-1"
              >
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Void is researching…
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar — sticky, no outer glow container causing layout shift */}
      <div className="relative z-10 px-4 pb-4 pt-3 bg-transparent">

        {/* Subtle fade from below messages into input area */}
        <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-white/80 dark:to-void-950/80" />

        {/* Ambient glow behind the input pill only */}
        <div className="pointer-events-none absolute inset-x-8 inset-y-0 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-cyan-400/20 blur-2xl opacity-60" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative mx-auto flex max-w-3xl gap-2 rounded-3xl border border-neutral-200/80 dark:border-white/[0.07] bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-2 shadow-lg shadow-indigo-500/10 focus-within:border-indigo-400/50 dark:focus-within:border-indigo-500/30 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all duration-200"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a research question…"
            disabled={loading || switchingSession}
            className="flex-1 bg-transparent px-3 py-2 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none"
          />

          <button
            type="submit"
            disabled={loading || switchingSession || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl void-gradient-bg text-white transition-all disabled:opacity-40 hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/20"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}