'use client';

import { usePathname } from 'next/navigation';
import { useTopics, useLockUnlockTopic, useDeleteTopic } from '../api';
import { isAdmin } from '@/lib/auth';
import type { Topic } from '../types';

export function TopicList() {
  const pathname = usePathname();
  const { data: topics, isLoading } = useTopics();
  const lockUnlock = useLockUnlockTopic();
  const deleteTopic = useDeleteTopic();
  const admin = isAdmin();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading topics…
      </div>
    );
  }

  const topicList = topics ?? [];

  const handleToggleLock = async (topic: Topic) => {
    try {
      await lockUnlock.mutateAsync({ topicId: topic.id, lock: !topic.isLocked });
    } catch {
      // Error already surfaced by mutation
    }
  };

  const handleDelete = async (topic: Topic) => {
    if (!window.confirm(`Delete topic "${topic.name}"? This cannot be undone.`)) return;
    try {
      await deleteTopic.mutateAsync(topic.id);
    } catch {
      // Error surfaced by mutation
    }
  };

  return (
    <div className="h-full overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
          Topics
        </h2>
        {admin && (
          <button
            className="h-8 px-3 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors"
            onClick={() => {}}
          >
            Create Topic
          </button>
        )}
      </div>
      <div className="overflow-y-auto">
        {topicList.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
            No topics yet
          </div>
        ) : (
          topicList.map((topic: Topic) => {
            const isActive = pathname === `/app/chat/${topic.id}`;
            return (
              <div
                key={topic.id}
                className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-500' : ''}`}
              >
                <a
                  href={`/app/chat/${topic.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0">
                    {topic.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">
                        {topic.name}
                      </span>
                      {topic.isLocked ? (
                        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {topic.description ?? 'No description'}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {topic.messageCount}
                  </span>
                </a>
                {admin && (
                  <div className="px-4 py-2 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleLock(topic);
                      }}
                      className={`h-7 px-2 rounded text-xs font-medium transition-colors ${
                        topic.isLocked
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                        disabled={lockUnlock.isPending}
                    >
                      {lockUnlock.isPending ? '…' : topic.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(topic);
                      }}
                      className="h-7 px-2 rounded text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 disabled:opacity-50 transition-colors"
                      disabled={deleteTopic.isPending}
                    >
                      {deleteTopic.isPending ? '…' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
