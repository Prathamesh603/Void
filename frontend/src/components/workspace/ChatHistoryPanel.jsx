import { motion } from 'framer-motion';
import { MessageSquarePlus, Trash2 } from 'lucide-react';

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
  onSwitchUser,
}) {
  return (
    <div className="flex h-full flex-col bg-neutral-100 dark:bg-void-900 text-neutral-800 dark:text-neutral-200 border-r border-neutral-200 dark:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-300 font-display">Chats</h2>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 transition hover:bg-neutral-50 dark:hover:bg-white/10 hover:border-indigo-500/40"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
            No chats yet. Start a new research session.
          </p>
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
                      active ? 'bg-indigo-500/10 dark:bg-indigo-600/25 ring-1 ring-indigo-500/30 dark:ring-indigo-500/40' : 'hover:bg-neutral-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(s.session_id)}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                    >
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
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
                      className="mr-2 rounded p-1.5 text-neutral-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
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

      {/* User Profile Section at the bottom */}
      {currentUser && (
        <div className="border-t border-neutral-200 dark:border-white/10 p-3 bg-neutral-200/20 dark:bg-void-950/40">
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-void-900/50 p-2.5 shadow-sm">
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs">
                {currentUser.user_id ? currentUser.user_id[0] : 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {currentUser.user_id}
                </p>
                <p className="truncate text-[9px] text-neutral-500 dark:text-neutral-450 leading-none mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSwitchUser}
              className="ml-2 shrink-0 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-void-800 px-2 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-void-700 transition"
            >
              Switch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
