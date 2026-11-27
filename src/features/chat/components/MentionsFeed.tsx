'use client';

import { useRouter } from 'next/navigation';
import { useMentions } from '../api';
import type { Mention } from '../types';

export function MentionsFeed() {
  const { data: mentions, isLoading } = useMentions();
  const router = useRouter();

  const mentionList = mentions ?? [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading mentions…
      </div>
    );
  }

  const unreadCount = mentionList.filter((m) => !m.read).length;

  return (
    <div className="h-full overflow-y-auto border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
          Tagged Me
        </h2>
        {unreadCount > 0 && (
          <span className="h-5 px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-semibold text-white">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="overflow-y-auto">
        {mentionList.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
            No mentions yet
          </div>
        ) : (
          mentionList.map((mention: Mention) => (
            <div
              key={mention.id}
              onClick={() => {
                router.push(`/app/chat/${mention.topicId}#msg-${mention.id}`);
              }}
              className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer ${!mention.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0">
                  {mention.senderUsername.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {mention.senderUsername} mentioned you
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {mention.messageSnippet}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {mention.topicName} · {new Date(mention.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
