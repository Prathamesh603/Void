import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { pickWorkspaceQuote } from '../../lib/constants';

const suggestions = [
  'Find recent papers on Indic LLM evaluation',
  'Summarize trends in physics-informed neural networks',
  'Compare transformer efficiency methods from arXiv',
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
  const quote = pickWorkspaceQuote(isNewSession ? 0 : 2);

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
    <div className="relative z-10 flex h-full flex-col bg-[#fcfbf9] dark:bg-void-950 transition-colors duration-300 overflow-hidden">

      {/* Header */}
      <div className="relative z-10 border-b border-neutral-200/50 dark:border-white/10 px-5 py-3.5 bg-white/60 dark:bg-void-950/80 backdrop-blur-sm">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-normal tracking-tight  dark:text-neutral-200">
              {isNewSession ? 'New शोध session' : 'Research chat'}
            </h2>
            {sessionName && (
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-sans">{sessionName}</p>
            )}
          </div>
          <p className="hidden sm:block font-deva text-xs text-neutral-400 shrink-0">
            ✦ {quote.deva}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {switchingSession ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex justify-start">
              <div className="w-[60%] rounded-2xl px-4 py-3 bg-white/80 dark:bg-white/[0.04] border border-neutral-200/60 dark:border-white/[0.07] animate-pulse space-y-2">
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="w-[40%] rounded-2xl px-4 py-3 bg-neutral-200/60 dark:bg-white/10 border border-neutral-300/40 animate-pulse">
                <div className="h-3 bg-neutral-300/50 dark:bg-white/10 rounded w-2/3 ml-auto" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-xl text-center pt-10 md:pt-16"
          >
            <p className="font-deva text-sm text-neutral-500 flex items-center justify-center gap-2">
              <span>✦</span>
              <span>{quote.deva}</span>
              <span>✦</span>
            </p>
            <p className="mt-1 text-[11px] text-neutral-400 italic">naलaइtह</p>

            <h3 className="mt-8 font-display text-2xl md:text-3xl font-normal tracking-tight dark:text-neutral-100">
              {isNewSession ? (
                <>Begin your <em className="italic">शोध.</em></>
              ) : (
                'Continue your research'
              )}
            </h3>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans max-w-md mx-auto">
              Ask Techshodh to search arXiv, explain concepts, or dive into papers saved in this session.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  disabled={loading || switchingSession}
                  className="rounded-full border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-200 transition font-sans disabled:opacity-50 shadow-sm"
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
                  {m.role === 'assistant' && (
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded font-display italic text-xs">
                      <img src="/favicon.png"></img>
                    </div>
                  )}
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-[1.65] workspace-user-bubble shadow-sm'
                        : 'max-w-[88%] py-2 text-[15px] leading-[1.65] text-neutral-800 dark:text-neutral-200'
                    }
                  >
                    {m.role === 'assistant' ? (
                      <div className="markdown-body prose-invert prose-neutral max-w-none">
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }) {
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
                            className="rounded-md bg-neutral-100 dark:bg-white/10 px-2 py-0.5 text-[10px] tracking-wide text-neutral-500 dark:text-neutral-400 uppercase"
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
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                <Sparkles className="h-4 w-4 text-amber-600/70 dark:text-amber-400/70" />
                Techshodh is researching…
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="relative z-10 px-4 pb-3 pt-2 bg-transparent">
        <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-[#fcfbf9]/90 dark:to-void-950/90" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative mx-auto flex max-w-3xl gap-2 rounded-2xl border border-neutral-200/80 dark:border-white/[0.07] bg-white/90 dark:bg-white/[0.04] backdrop-blur-xl p-2 shadow-sm focus-within:border-neutral-300 dark:focus-within:border-white/15 focus-within:ring-1 focus-within:ring-neutral-200/60 dark:focus-within:ring-white/5 transition-all duration-200"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a research question…"
            disabled={loading || switchingSession}
            className="flex-1 bg-transparent px-3 py-2 text-[15px] text-ink dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none font-sans"
          />

          <button
            type="submit"
            disabled={loading || switchingSession || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl workspace-btn-primary transition-all disabled:opacity-40 hover:scale-105 active:scale-95 shadow-sm"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500 text-center font-deva">
          सा विद्या या विमुक्तये · Techshodh can make mistakes — verify important claims
        </p>
      </div>
    </div>
  );
}
