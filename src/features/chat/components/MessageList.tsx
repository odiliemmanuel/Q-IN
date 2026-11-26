'use client';

import { useEffect, useRef, useState } from 'react';
import { useMessages, useSendMessage } from '../api';
import { useTopicStream } from '../hooks/useTopicStream';
import type { Message } from '../types';

const MENTION_SPLIT_REGEX = /(@[a-zA-Z0-9_.-]{2,32})/g;

export function MessageContent({ content, deleted }: { content: string; deleted: boolean }) {
  if (deleted) {
    return <p className="italic text-muted-foreground">This message was deleted</p>;
  }

  const parts = content.split(MENTION_SPLIT_REGEX);
  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, idx) =>
        part.startsWith('@') ? (
          <span key={idx} className="rounded bg-blue-100 px-1 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </p>
  );
}

interface MessageListProps {
  topicId: string;
  isLocked: boolean;
  currentUserId: string;
}

export function MessageList({ topicId, isLocked, currentUserId }: MessageListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(topicId);
  const sendMessage = useSendMessage();
  const [newContent, setNewContent] = useState('');

  useTopicStream(topicId);

  const messages = data?.pages.flat() ?? [];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await sendMessage.mutateAsync({ topicId, content: newContent.trim() });
    setNewContent('');
  };

  return (
    <div className="flex flex-col h-full border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollContainerRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-20">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg: Message) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.senderId === currentUserId ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg rounded-tr-lg rounded-tl-lg ${
                msg.senderId === currentUserId
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              }`}
            >
              <MessageContent content={msg.content} deleted={msg.deleted} />
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {msg.senderUsername}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.edited && <span className="text-[10px] text-slate-400 dark:text-slate-500">(edited)</span>}
              </div>
            </div>
          </div>
        ))}
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mx-auto px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/30 rounded-lg"
          >
            {isFetchingNextPage ? 'Loading older…' : 'Load older messages'}
          </button>
        )}
      </div>

      {isLocked ? (
        <div className="p-4 bg-amber-50 border-t border-amber-200 dark:bg-amber-900/20 dark:border-amber-500/40">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-4m3 4v-4" />
            </svg>
            This topic is locked by an admin. No new messages can be sent.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative">
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors resize-none"
              rows={2}
              placeholder="Type a message…"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              disabled={!newContent.trim()}
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
