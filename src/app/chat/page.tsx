'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopicList } from '@/features/chat/components/TopicList';
import { CreateTopicModal } from '@/features/chat/components/CreateTopicModal';

export default function ChatPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="w-80 flex-shrink-0">
        <TopicList />
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm">
              C
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Community Chat</h1>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="h-8 px-4 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            New Topic
          </button>
        </header>

        <main className="flex-1 p-6">
          <div className="text-center text-slate-400 text-sm mt-20">
            Select a topic from the sidebar to start chatting.
          </div>
        </main>
      </div>

      <CreateTopicModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onTopicCreated={(topicId) => {
          setCreateOpen(false);
          router.push(`/app/chat/${topicId}`);
        }}
      />
    </div>
  );
}
