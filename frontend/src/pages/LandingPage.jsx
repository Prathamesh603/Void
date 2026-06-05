import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Search,
    video: "/Void_clip1.mp4",
    title: 'Search academic sources',
    body: 'Ask Void to find papers on arXiv and the web. Results are saved to your session automatically.',
    tag: 'MULTI-SOURCE SEARCH',
    color: 'from-violet-500/20 to-indigo-500/10',
  },
  {
    icon: Zap,
    video: "/Void_clip2.mp4",
    title: 'Instant research insights',
    body: 'Get summaries, comparisons, and answers grounded in the papers Void discovers for you.',
    tag: 'AI RESEARCH PARTNER',
    color: 'from-cyan-500/20 to-blue-500/10',
  },
  {
    icon: FileText,
    video: "/Void_clip3.mp4",
    title: 'Papers at your fingertips',
    body: 'Every paper from your research lives in the sidebar. Open, index, and query PDFs with RAG.',
    tag: 'PDF + VECTOR INDEX',
    color: 'from-fuchsia-500/20 to-purple-500/10',
  },
  {
    icon: MessageSquare,
    video: "/Void_clip4.mp4",
    title: 'Multi-session memory',
    body: 'Organize research into chats. Pick up any thread and continue where you left off.',
    tag: 'PERSISTENT SESSIONS',
    color: 'from-amber-500/20 to-orange-500/10',
  },
];

export default function LandingPage() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('void_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('void_theme', theme);
  }, [theme]);

  const headlines = [
  { plain: 'Understand', grad: 'everything' },
  { plain: 'An endless space', grad: 'for research.' },
  { plain: 'Every question deserves', grad: 'a universe.' },
  { plain: 'Explore the', grad: 'infinite void.' }
];

const [idx, setIdx] = useState(0);

useEffect(() => {
  const t = setInterval(() => setIdx(i => (i + 1) % headlines.length), 3000);
  return () => clearInterval(t);
}, []);
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-void-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <header className="fixed top-0 z-50 w-full border-b border-neutral-200/80 dark:border-white/10 bg-[#fafafa]/80 dark:bg-[#0a0a0b]/80 backdrop-blur-3xl transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white text-2xl font-bold shadow-md border border-neutral-800"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              V
            </span>
            <span className="font-display italic font-semibold text-3.5xl">Void</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-neutral-600 dark:text-neutral-400 md:flex">
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#how" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link
              to="/app"
              className="rounded-full bg-neutral-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-neutral-900 transition hover:bg-neutral-800 dark:hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start researching
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
          <motion.div
            className="relative mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-700 dark:text-indigo-300"
            >
              <Sparkles className="h-4 w-4" />
              Your research agent
            </motion.p>
            <motion.h1
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl leading-[1.1] tracking-tight md:text-7xl"
            >
  {headlines[idx].plain}{' '}
  <span className="void-gradient-text italic">{headlines[idx].grad}</span>
</motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400 md:text-xl"
            >
              Void is your research and thinking partner — grounded in papers you discover,
              built for deep academic work with multi-session chat and RAG over PDFs.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-white px-8 py-4 text-base font-medium text-white dark:text-neutral-900 shadow-lg shadow-neutral-900/20 dark:shadow-none transition hover:bg-neutral-800 dark:hover:bg-neutral-100"
              >
                Try Void
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 dark:border-white/10 bg-white dark:bg-void-900 px-8 py-4 text-base font-medium transition hover:border-neutral-400 dark:hover:border-white/20 text-neutral-900 dark:text-neutral-100"
              >
                See features
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10 bg-void-950 shadow-2xl shadow-indigo-500/10"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs text-neutral-500">void — workspace</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-white/5 p-1 min-h-[280px]">
              <div className="bg-void-900 p-4 text-left">
                <p className="text-xs font-medium text-neutral-500 mb-3">Chats</p>
                <div className="space-y-2">
                  {['Quantum ML survey', 'Transformer papers', 'New chat'].map((t) => (
                    <div key={t} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-neutral-300">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-void-900 p-4 flex flex-col">
                <p className="text-xs font-medium text-neutral-500 mb-3">Chat</p>
                <p className="text-sm text-neutral-400 flex-1">
                  Find recent papers on physics-informed neural networks…
                </p>
                <div className="mt-4 rounded-xl border border-white/10 bg-void-800 px-3 py-2 text-xs text-neutral-500">
                  Ask a research question…
                </div>
              </div>
              <div className="bg-void-900 p-4 text-left">
                <p className="text-xs font-medium text-neutral-500 mb-3">Papers</p>
                <div className="space-y-2">
                  {['PINNs for PDEs', 'Deep learning review'].map((t) => (
                    <div key={t} className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-void-900 px-6 py-24 transition-colors duration-300">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-4xl md:text-5xl">
              Built for serious research
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600 dark:text-neutral-400">
              Inspired by the clarity of modern research tools — with the power of your backend agent.
            </p>
            <div className="mt-16 space-y-24">
              {features.map((f, i) => (
                <motion.article
                  key={f.title}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6 }}
                  className={`grid items-center gap-12 md:grid-cols-2 ${
                    i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  <div>
                    <span className="inline-block rounded-md bg-neutral-900 dark:bg-void-800 px-2 py-1 text-[10px] font-bold tracking-wider text-white">
                      {f.tag}
                    </span>
                    <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-void-800">
                      <f.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="mt-4 text-2xl font-display font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300">
                    {f.title}</h3>
                    <p className="mt-3 text-neutral-400/90 leading-relaxed text-[15px] font-light tracking-wide">
                    {f.body}</p>
                  </div>
                    <div className="w-full max-w-[520px] mx-auto">
                  <div
                  className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black"
                  style={{
                  boxShadow: "0 0 40px rgba(59,130,246,0.4), 0 0 50px rgba(168,85,247,0.3)"
                  }}
                  > 
                <video
                className="h-full w-full object-fill"
                autoPlay
                loop
                muted
                playsInline
                >
              <source src={f.video} type="video/mp4" />
              </video>
            </div>
          </div>
                  
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="px-6 py-24 bg-neutral-50 dark:bg-void-950 border-t border-neutral-200 dark:border-white/10 transition-colors duration-300">
          <div className="mx-auto max-w-4xl text-center">
            <BookOpen className="mx-auto h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            <h2 className="mt-4 font-display text-3xl md:text-4xl">How it works</h2>
            <ol className="mt-12 space-y-8 text-left max-w-lg mx-auto">
              {[
                'Start a new research chat or continue an existing session.',
                'Ask Void to search arXiv, the web, or analyze topics.',
                'Papers appear in the right panel — click to download and open the PDF.',
                'Indexed papers power RAG for deeper questions in the same session.',
              ].map((step, n) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500/20 text-sm font-bold text-white dark:text-indigo-300">
                    {n + 1}
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300 pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <Link
              to="/app"
              className="mt-12 inline-flex items-center gap-2 void-gradient-bg rounded-full px-8 py-4 font-medium text-white shadow-lg shadow-indigo-500/10 hover:scale-[1.02] transition"
            >
              Open workspace
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 dark:border-white/10 px-6 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <p>Void — Your Research Agent</p>
      </footer>
    </div>
  );
}
