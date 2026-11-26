'use client';

import { useRef, useState } from 'react';
import { useMentionAutocomplete } from '../hooks/useMentionAutocomplete';

interface MessageComposerProps {
  isLocked: boolean;
  onSend: (content: string) => void;
  replyToMessage?: { id: string; senderUsername: string; content: string } | null;
  onClearReply: () => void;
}

export function MessageComposer({
  isLocked,
  onSend,
  replyToMessage,
  onClearReply,
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [localResults, setLocalResults] = useState<string[]>([]);
  const [localHighlighted, setLocalHighlighted] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionCount, setMentionCount] = useState(0);

  const {
    handleTextChange,
    handleSelect,
    handleKeyDown,
    isSearching,
  } = useMentionAutocomplete({
    onSelect: (username: string) => {
      setLocalQuery('');
      setLocalResults([]);
      setLocalHighlighted(-1);
      setContent((prev) => {
        const before = prev.slice(0, textareaRef.current?.selectionStart ?? 0);
        const after = prev.slice(textareaRef.current?.selectionEnd ?? 0);
        return `${before}@${username} ${after}`;
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setMentionCount((e.target.value.match(/@/g) || []).length);
    const ta = e.target as HTMLTextAreaElement;
    handleTextChange(ta.value, ta.selectionStart);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSend(content.trim());
    setContent('');
    setLocalQuery('');
    setLocalResults([]);
    setLocalHighlighted(-1);
  };

  if (isLocked) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 dark:bg-amber-900/30 dark:border-amber-500/40 dark:text-amber-400 text-xs font-medium">
        This topic is locked by an admin. No new messages can be sent.
      </div>
    );
  }

  if (mentionCount > 10) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 dark:bg-rose-900/20 dark:border-rose-500/40 dark:text-rose-400 text-xs font-medium">
        Maximum 10 @mentions per message reached.
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
      {replyToMessage && (
        <div className="mb-2 p-2 bg-slate-100 rounded-lg border-l-2 border-brand-500 dark:bg-slate-800 dark:border-brand-500 text-xs text-slate-600 dark:text-slate-400">
          Replying to <span className="font-medium">{replyToMessage.senderUsername}</span>: {replyToMessage.content}
          <button
            onClick={onClearReply}
            className="ml-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ×
          </button>
        </div>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors resize-none"
          rows={2}
          maxLength={2000}
          placeholder="Type a message…"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          disabled={!content.trim()}
        >
          Send
        </button>
      </div>
      {localQuery && localResults.length > 0 && (
        <div className="absolute z-20 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg dark:bg-slate-800 dark:border-slate-700">
          {localResults.map((username: string, idx: number) => (
            <button
              key={username}
              onClick={() => handleSelect(username)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${idx === localHighlighted ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
            >
              @{username}
            </button>
          ))}
          {isSearching && (
            <div className="px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500">
              Searching…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
