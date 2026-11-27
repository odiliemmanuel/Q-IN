'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { MessageList } from '@/features/chat/components/MessageList';
import { MessageComposer } from '@/features/chat/components/MessageComposer';
import { useTopics } from '@/features/chat/api';

export default function TopicPage() {
  const params = useParams();
  const topicId = params.topicId as string;
  const user = useAuthStore((state) => state.user);
  const { data: topics } = useTopics();
  const [topic, setTopic] = useState<{ id: string; name: string; isLocked: boolean } | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; senderUsername: string; content: string } | null>(null);

  useEffect(() => {
    const t = topics?.find((t) => t.id === topicId);
    if (t) setTopic({ id: t.id, name: t.name, isLocked: t.isLocked });
  }, [topics, topicId]);

  const handleSend = (content: string) => {
    console.log('Sending:', content);
  };

  if (!topic) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Loading topic…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{topic.name}</h1>
          {topic.isLocked && (
            <span className="h-2 w-2 rounded-full bg-rose-500 dark:bg-rose-400"></span>
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Topic ID: {topic.id}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Online
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <MessageList topicId={topicId} isLocked={topic.isLocked} currentUserId={user?.id ?? ''} />
        <MessageComposer
          isLocked={topic.isLocked}
          onSend={handleSend}
          replyToMessage={replyTo}
          onClearReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
}
