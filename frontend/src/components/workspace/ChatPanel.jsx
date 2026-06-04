import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';

const suggestions = [
  'Find recent papers on transformer architectures',
  'Summarize trends in physics-informed neural networks',
  'What are the latest advances in RAG for research?',
];

export default function ChatPanel({
  messages,
  loading,
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
    if (!msg || loading) return;
    setInput('');
    onSend(msg);
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-void-950 transition-colors duration-300">
      <div className="border-b border-neutral-200 dark:border-white/10 px-5 py-3 bg-white dark:bg-void-950 transition-colors">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-300 font-display">Chat</h2>
        {sessionName && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-450 mt-0.5 font-display">{sessionName}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {messages.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-xl text-center pt-12 md:pt-20"
          >
            <span className="text-4xl">👋</span>
            <h3 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-neutral-105 font-display">
              {isNewSession ? "Let's start your research" : 'Continue your research'}
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
              Ask Void to search papers, explain concepts, or dive into sources saved in this
              session.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 hover:border-indigo-500/40 hover:text-neutral-900 dark:hover:text-neutral-200 transition font-sans"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={`${i}-${m.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-neutral-50 dark:bg-void-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/5 shadow-sm'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div className="markdown-body prose-invert prose-neutral max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                    {m.tools_used?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 border-t border-neutral-200 dark:border-white/10 pt-2">
                        {m.tools_used.map((t) => (
                          <span
                            key={t.tool_name}
                            className="rounded-md bg-neutral-200/50 dark:bg-white/10 px-2 py-0.5 text-[10px] text-neutral-600 dark:text-neutral-400"
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
                className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
              >
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500 dark:text-indigo-400" />
                <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                Void is researching…
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200 dark:border-white/10 p-4 bg-white dark:bg-void-950 transition-colors">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto flex max-w-3xl gap-2 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-800 p-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition shadow-sm"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a research question…"
            disabled={loading}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl void-gradient-bg text-white transition disabled:opacity-40 hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/10"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
