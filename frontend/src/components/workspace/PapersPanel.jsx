import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Send,
} from 'lucide-react';
import { useState } from 'react';

export default function PapersPanel({
  papers,
  downloadedIds,
  switchingSession,
  viewMode,
  activePaper,
  pdfUrl,
  loadingPaperId,
  onSelectPaper,
  onBack,
  onQueryPdf,
  queryLoading,
  error,
}) {
  const [pdfQuery, setPdfQuery] = useState('');

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    if (!pdfQuery.trim() || queryLoading) return;
    onQueryPdf(pdfQuery.trim());
    setPdfQuery('');
  };

  if (viewMode === 'pdf' && activePaper) {
    return (
      <div className="relative z-10 flex h-full flex-col workspace-panel-sidebar border-l border-neutral-200/50 dark:border-white/10 transition-colors duration-300">
        <div className="flex items-center gap-2 border-b border-neutral-200/50 dark:border-white/10 px-3 py-2 bg-white/50 dark:bg-void-950">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-white dark:hover:bg-white/10 hover:text-neutral-800 dark:hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </button>
        </div>
        <div className="border-b border-neutral-200/50 dark:border-white/10 px-4 py-3 bg-white/70 dark:bg-void-950">
          <h3 className="line-clamp-2 text-sm font-medium text-ink dark:text-neutral-100 font-display">
            {activePaper.title}
          </h3>
          {activePaper.authors && (
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-450 font-sans">{activePaper.authors}</p>
          )}
        </div>
        <div className="flex-1 min-h-0 bg-neutral-50 dark:bg-void-900 relative">
          {pdfUrl ? (
            <iframe
              title={activePaper.title}
              src={pdfUrl}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col p-6 overflow-hidden bg-white dark:bg-[#0c0c0e] animate-pulse space-y-6">
              <div className="flex flex-col items-center space-y-2 mt-4">
                <div className="h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded w-4/5" />
                <div className="h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/5" />
                <div className="h-2 bg-neutral-150 dark:bg-neutral-900 rounded w-1/4 mt-2" />
              </div>
              <div className="h-px bg-neutral-150 dark:bg-white/5 w-full" />
              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                    <div className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                    <div className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded w-[95%]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                    <div className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded w-[90%]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-neutral-200/50 dark:border-white/10 bg-white/80 dark:bg-void-950 px-3 py-3">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
            Ask about this paper
          </p>
          <p className="font-deva text-[10px] text-neutral-400 mb-2">इस ग्रंथ के बारे में पूछें</p>
          <form onSubmit={handleQuerySubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={pdfQuery}
              onChange={(e) => setPdfQuery(e.target.value)}
              placeholder="e.g. What methodology was used?"
              disabled={queryLoading}
              className="flex-1 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-900 px-3 py-2 text-xs text-ink dark:text-white placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-white/20 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={queryLoading || !pdfQuery.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl workspace-btn-primary disabled:opacity-40 
                      bg-gradient-to-r from-orange-500 to-pink-500 
                      text-white transition-all 
                      shadow-[0_0_15px_rgba(255,120,0,0.6)] 
                      hover:scale-105 active:scale-95 
                      hover:shadow-[0_0_25px_rgba(255,80,150,0.8)] 
                      disabled:opacity-40"
            >
              {queryLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex h-full flex-col workspace-panel-sidebar border-l border-neutral-200/50 dark:border-white/10 text-ink dark:text-neutral-200 transition-colors duration-300">
      <div className="border-b border-neutral-200/50 dark:border-white/10 px-4 py-3.5">
        <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Library</p>
        <p className="font-deva text-xs text-neutral-500 mt-0.5">ग्रंथालय · arXiv & search</p>
      </div>

      {error && (
        <div className="mx-3 mt-3 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {switchingSession ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-full rounded-xl border border-neutral-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 animate-pulse"
              >
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 shrink-0 rounded bg-neutral-200 dark:bg-neutral-700 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
                    <div className="h-2 bg-neutral-150 dark:bg-neutral-800 rounded w-1/3 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <BookOpen className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="mt-4 font-deva text-sm text-neutral-500">ग्रंथ यहाँ दिखेंगे</p>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed max-w-[200px]">
              Papers from your research appear here after Techshodh searches arXiv or the web.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {papers.map((paper) => {
              const isDownloaded = downloadedIds.has(paper.paper_id);
              const isLoading = loadingPaperId === paper.paper_id;

              return (
                <motion.li
                  key={paper.paper_id}
                  layout
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectPaper(paper)}
                    disabled={!!loadingPaperId}
                    className="w-full rounded-xl border border-neutral-200/60 dark:border-white/10 bg-white dark:bg-void-800/80 p-3 text-left transition hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-sm disabled:opacity-60 shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 font-sans leading-snug">
                          {paper.title}
                        </p>
                        {paper.arxiv_id && (
                          <p className="mt-1 text-[10px] text-neutral-400 font-sans">
                            {paper.arxiv_id}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          {isDownloaded && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Indexed
                            </span>
                          )}
                          {isLoading && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Opening…
                            </span>
                          )}
                        </div>
                      </div>
                      {paper.pdf_url && (
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                          aria-label="Open source link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
