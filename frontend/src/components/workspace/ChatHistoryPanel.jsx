import { motion } from 'framer-motion';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { pickWorkspaceQuote } from '../../lib/constants';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatHistoryPanel({
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
  currentUser,
  onLogout,
}) {
  const footerQuote = pickWorkspaceQuote(sessions.length);

  return (
    <div className="relative z-10 flex h-full flex-col workspace-panel-sidebar border-r border-neutral-200/50 dark:border-white/10 text-ink dark:text-neutral-200 transition-colors duration-300">
      <div className="border-b border-neutral-200/50 dark:border-white/10 px-4 py-3.5">
        <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Sessions</p>
        <p className="font-deva text-xs text-neutral-500 mt-0.5">सत्र · शोध</p>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200/70 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-ink dark:text-neutral-200 transition hover:bg-neutral-50 dark:hover:bg-white/10 hover:shadow-sm shadow-sm"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New शोध session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="font-deva text-sm text-neutral-500">अन्वेषणं ज्ञानस्य मार्गः</p>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              No sessions yet. Start a new शोध to begin.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((s) => {
              const active = s.session_id === currentSessionId;
              return (
                <motion.li
                  key={s.session_id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div
                    className={`group flex items-center gap-1 rounded-lg transition ${
                      active
                        ? 'workspace-session-active'
                        : 'hover:bg-white/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(s.session_id)}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 font-sans tracking-tight truncate">
                        {s.session_name || 'Untitled'}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {formatDate(s.created_at)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(s.session_id);
                      }}
                      className="mr-2 rounded p-1.5 text-neutral-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 group-hover:opacity-100"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      {currentUser && (
        <div className="border-t border-neutral-200/50 dark:border-white/10 p-3">
          <p className="text-center font-deva text-[10px] text-neutral-400 mb-2 px-2 leading-relaxed">
            ✦ {footerQuote.deva} ✦
          </p>
          <div className="flex items-center justify-between rounded-xl border border-neutral-200/60 dark:border-white/10 bg-white/80 dark:bg-void-900/50 p-2.5 shadow-sm">
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background font-display italic text-sm">
                {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="ml-2 shrink-0 rounded-lg border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-void-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-void-700 transition"
            >
              Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
