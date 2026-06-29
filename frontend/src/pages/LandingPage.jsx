import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
  Database,
  Lock,
  BookOpen,
  Layers
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
    title: 'Search across arXiv & the open web',
    hindiTag: 'बहु-स्रोत खोज',
    tag: 'MULTI-SOURCE SEARCH',
    body: 'Ask Techshodh a question — it pulls papers from arXiv, semantic search, and the open web in one pass, citing every source.',
  },
  {
    icon: FileText,
    title: 'Index PDFs, query like a scholar',
    hindiTag: 'RAG ओवर PDF',
    tag: 'PDF + VECTOR INDEX',
    body: 'Every paper you open is chunked and embedded. Ask follow-ups grounded in exact passages, not hallucinations.',
  },
  {
    icon: MessageSquare,
    title: 'Multi-session research memory',
    hindiTag: 'स्मृति',
    tag: 'PERSISTENT SESSIONS',
    body: 'Organise work into chats. Resume a six-month-old thesis thread exactly where you left off — context intact.',
  },
  {
    icon: Zap,
    title: 'Summaries, comparisons, critiques',
    hindiTag: 'तात्क्षण',
    tag: 'INSTANT INSIGHT',
    body: 'Compare methods across five papers, surface contradictions, or draft a related-work section in seconds.',
  },
  {
    icon: Database,
    title: 'Built with Indian languages in mind',
    hindiTag: 'भारतीय भाषाएँ',
    tag: 'INDIC LINGUISTICS',
    body: 'Read, summarise and discuss in English, Hindi, Tamil, Bengali and more — Bharat-first, not bolted on.',
  },
  {
    icon: Lock,
    title: 'Your library, your control',
    hindiTag: 'आपका डेटा',
    tag: 'YOUR DATA',
    body: 'Papers, notes and embeddings stay tied to your workspace. Export anytime, no lock-in.',
  }
];

const steps = [
  {
    num: '1',
    text: 'Start a शोध (shodh) session and type your research question.'
  },
  {
    num: '2',
    text: 'Techshodh searches arXiv, the web, and your library in parallel.'
  },
  {
    num: '3',
    text: "Open any paper — it's indexed for RAG instantly in the sidebar."
  },
  {
    num: '4',
    text: 'Ask, compare, critique. Citations link back to the exact passage.'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#1c1c1a] relative overflow-hidden font-sans">

      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-neutral-200/30 bg-[#faf6f0]/90 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-normal tracking-tight text-black">
            <span className="font-display italic font-normal text-2xl">Techshodh</span>
          </Link>
          <nav className="hidden items-center gap-8 text-[11px] font-sans font-semibold uppercase tracking-wider text-neutral-500 md:flex">
            <a href="#how" className="hover:text-neutral-900 transition-colors">
              How it works
            </a>
            <a href="#philosophy" className="hover:text-neutral-900 transition-colors">
              Philosophy
            </a>
            <a href="#features" className="hover:text-neutral-900 transition-colors">
              Features
            </a>
          </nav>
          <div className="flex items-center gap-6">
            <a href="#signin" className="text-[11px] font-sans font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block">
              Sign in
            </a>
            <Link
              to="/app"
              className="rounded-full bg-neutral-900 px-4 py-1.5 text-[12px] font-medium text-white transition hover:bg-neutral-800 shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-14">

        {/* Section 1: Hero Section (Research with शोध. Reason like a scholar.) */}
        <section className="relative min-h-[93vh] flex flex-col items-center justify-center px-6 pt-16 pb-28 bg-[#faf6f0]" style={{ overflow: 'hidden' }}>
          {/* Ambient Background Gradient matching Kiyosaki rainbow colors exactly without dilution */}
          <div className="absolute inset-0 ambient-glow-bg-strong z-0" />

          <motion.div
            className="relative z-10 mx-auto max-w-5xl text-center flex flex-col items-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {/* Center-aligned elegant star tagline — font-deva matching reference */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-8 font-deva text-base text-neutral-500 flex items-center justify-center gap-2"
            >
              <span>✦</span>
              <span>विद्या ददाति विनयम्</span>
              <span>✦</span>
            </motion.div>

            {/* Hero title — fluid clamp(3rem, 9vw, 8rem), leading-[0.95] */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display font-normal hero-title text-ink max-w-5xl mx-auto"
            >
              Research with <em className="italic">शोध.</em><br />
              Reason like a <em className="italic">scholar.</em>
            </motion.h1>

            {/* Subparagraph — text-lg text-ink/80 matching reference */}
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-10 max-w-xl text-lg text-ink/80 font-sans leading-relaxed"
            >
              Techshodh is Bharat's research agent — built for deep academic work, grounded in the papers it discovers for you.
            </motion.p>

            {/* Buttons — bg-foreground/text-background primary, bg-white/ring-border secondary */}
            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-base font-medium text-background transition hover:opacity-90"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-medium text-ink shadow-sm ring-1 ring-border transition hover:shadow-md"
              >
                Watch the Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Subtle Rajshahi Arc Graphic overlaying the gradient */}
          <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none z-0">
            <div className="w-[120vw] h-[40vh] rajshahi-arc border-t-[1px] border-neutral-300/20 bg-transparent"></div>
          </div>
        </section>

        {/* Mockup Preview Section - Floating over the gradient */}
        <section className="relative z-20 -mt-24 px-6 pb-24 bg-transparent">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-5xl overflow-hidden rounded-2xl parchment-glass border border-neutral-200/50 shadow-2xl shadow-neutral-900/10"
          >
            <div className="flex items-center justify-between border-b border-neutral-200/40 px-4 py-3 bg-white/50">
              <div className="flex gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              </div>
              <span className="text-xs font-medium text-neutral-400">techshodh — workspace</span>
              <div className="w-8"></div>
            </div>
            <div className="grid grid-cols-12 gap-px bg-neutral-200/40 min-h-[400px]">
              <div className="col-span-3 bg-white/70 p-4 text-left hidden md:block">
                <p className="text-[10px] font-bold tracking-wider text-neutral-400 mb-4 uppercase">Sessions</p>
                <div className="space-y-2">
                  {['Indic LLM evaluation', 'Transformer efficiency', 'Quantum computing'].map((t, i) => (
                    <div key={t} className={`rounded-lg px-3 py-2 text-xs font-medium ${i === 0 ? 'bg-white shadow-sm border border-neutral-200/40 text-neutral-800' : 'text-neutral-500 hover:bg-white/50'}`}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 bg-[#fcfbf9] p-6 flex flex-col relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-6 w-6 rounded  text-white flex items-center justify-center font-display italic text-sm"><img src="/favicon.png"></img></div>
                  <p className="text-sm font-medium text-neutral-800">How do we optimize transformer inference?</p>
                </div>
                <div className="flex gap-3 mb-6">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3 w-3 text-orange-400" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[13px] leading-relaxed text-neutral-600">Based on the retrieved papers, optimizing transformer inference primarily focuses on several key areas: model quantization, KV cache optimization, and efficient attention mechanisms.</p>
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1 shadow-sm">
                      <FileText className="h-3 w-3 text-red-500" />
                      <span className="text-[11px] font-medium text-neutral-700">Pope et al. (2022)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-4 relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white/80 backdrop-blur px-3 py-1 text-[10px] text-neutral-400 font-medium hidden sm:block">Context: 4 papers indexed</div>
                  <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3 text-sm text-neutral-400 shadow-sm flex items-center justify-between">
                    <span>Ask a follow-up question...</span>
                    <div className="h-6 w-6 rounded bg-neutral-100 flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 text-neutral-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-3 bg-white/70 p-4 text-left border-t md:border-t-0 md:border-l border-neutral-200/40">
                <p className="text-[10px] font-bold tracking-wider text-neutral-400 mb-4 uppercase">Library</p>
                <div className="space-y-3">
                  {[
                    { title: 'Efficiently Scaling Transformer Inference', year: '2022' },
                    { title: 'FlashAttention: Fast and Memory-Efficient Exact Attention', year: '2022' }
                  ].map((p, i) => (
                    <div key={i} className="rounded-lg border border-neutral-200/50 bg-white p-3 shadow-sm hover:border-neutral-300 transition-colors cursor-pointer">
                      <div className="flex gap-2">
                        <FileText className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-neutral-800 leading-snug">{p.title}</p>
                          <p className="text-[10px] text-neutral-400 mt-1">{p.year}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="bg-[#faf6f0] px-6 py-24 border-t border-neutral-200/20 relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl text-neutral-900 mb-4">
                Built for serious research.
              </h2>
              <p className="text-neutral-500 font-medium text-sm tracking-wide">
                तेजस्वि नावधीतमस्तु — may our learning be brilliant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="rounded-2xl border border-neutral-200/50 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] transition-shadow"
                >
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-neutral-500">{f.hindiTag}</span>
                    <span className="text-[10px] text-neutral-300">•</span>
                    <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">{f.tag}</span>
                  </div>
                  <h3 className="mb-3 font-display text-2xl tracking-tight text-neutral-900">
                    {f.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-neutral-500">
                    {f.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        {/* Section 2: How It Works Section (From prashna to prakash.) */}
        <section id="how" className="relative bg-[#faf6f0] px-6 py-28 border-t border-neutral-200/30 z-10 flex flex-col items-center">
          <div className="mx-auto max-w-5xl w-full text-center">

            {/* Elegant Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-[12px] font-medium text-neutral-700 shadow-sm mb-10">
              <BookOpen className="h-3.5 w-3.5 text-neutral-600" />
              <span>How it works</span>
            </div>

            {/* Display Heading with exact weights/italics */}
            <h2 className="font-display font-normal text-5xl md:text-6xl lg:text-[4.5rem] text-black tracking-tight mb-4">
              From <span className="italic">prashna</span> to <span className="italic">prakash.</span>
            </h2>
            <p className="text-neutral-500 font-sans text-[15px] tracking-normal mb-16">
              Question to clarity, in four steps.
            </p>

            {/* 2x2 Grid Layout for Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {steps.map((s) => (
                <div key={s.num} className="rounded-2xl border border-neutral-200/50 bg-white p-8 text-left shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[160px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white font-display text-base">
                      {s.num}
                    </div>
                    <Layers className="h-4 w-4 text-neutral-400" />
                  </div>
                  <p className="text-[14px] leading-relaxed text-neutral-750 font-medium">
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Philosophy Section (Knowledge that liberates.) */}
        <section id="philosophy" className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-28 overflow-hidden bg-[#faf6f0] border-t border-neutral-200/30">
          {/* Symmetrical ambient gradient underlay */}
          <div className="absolute inset-0 ambient-glow-bg-strong z-0" />

          <motion.div
            className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-6 text-[14px] text-neutral-500 font-sans tracking-wide"
            >
              सा विद्या या विमुक्तये
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display font-normal text-5xl md:text-7xl lg:text-[5.5rem] text-black tracking-tight max-w-3xl mx-auto mb-8"
            >
              Knowledge that <span className="italic">liberates.</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto max-w-2xl font-display text-[20px] md:text-[22px] leading-relaxed text-neutral-800 font-normal mb-10"
            >
              Techshodh is built in Bharat, for thinkers everywhere. Inspired by the rigour of our ṛṣis and the precision of modern research.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-4">
              <Link
                to="/app"
                className="group inline-flex items-center gap-1.5 rounded-full bg-black px-8 py-3.5 text-[14px] font-medium text-white shadow-lg transition hover:bg-neutral-800 hover:scale-[1.01]"
              >
                Begin your शोध
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center rounded-full bg-white border border-neutral-200 px-8 py-3.5 text-[14px] font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 hover:scale-[1.01]"
              >
                Read the docs
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Section 4: Detailed Features Grid */}

      </main>

      {/* Footer styled clean and minimal like reference 1 */}
      <footer className="border-t border-neutral-200/40 bg-[#faf6f0] px-8 py-5 relative z-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-[13px] text-neutral-500 font-medium">
          <div className="font-display italic text-lg text-black">Techshodh</div>
          <div>Made with 💖 in Bharat • © 2026</div>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-black transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-black transition-colors">Terms</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
