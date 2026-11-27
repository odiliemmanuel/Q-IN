'use client';

import { useState } from 'react';
import { useCreateTopic } from '../api';
import { z } from 'zod';

const topicSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120, 'Title must be at most 120 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

interface CreateTopicModalProps {
  open: boolean;
  onClose: () => void;
  onTopicCreated: (topicId: string) => void;
}

export function CreateTopicModal({ open, onClose, onTopicCreated }: CreateTopicModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createTopic = useCreateTopic();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = topicSchema.safeParse({ title, description });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Validation failed');
      return;
    }
    setSubmitting(true);
    try {
      const topic = await createTopic.mutateAsync({
        title: result.data.title,
        description: result.data.description,
      });
      onTopicCreated(topic.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md dark:bg-slate-900">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Create Topic
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors"
                placeholder="e.g. Product Design Discussion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Description (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors"
                rows={3}
                placeholder="What is this topic about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
            )}
          </form>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting || createTopic.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest('form');
              if (form) form.dispatchEvent(new Event('submit'));
            }}
            disabled={submitting || createTopic.isPending || !title.trim()}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {submitting || createTopic.isPending ? 'Creating...' : 'Create Topic'}
          </button>
        </div>
      </div>
    </div>
  );
}
