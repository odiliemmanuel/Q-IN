'use client';

import { MentionsFeed } from '@/features/chat/components/MentionsFeed';

export default function MentionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Mentions
      </h1>
      <MentionsFeed />
    </div>
  );
}
