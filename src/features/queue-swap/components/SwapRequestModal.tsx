'use client';

import { useState } from 'react';
import { useCreateSwap } from '../api';

interface SwapRequestModalProps {
  targetUserId: string;
  targetUserName: string;
  targetSlot: number;
  currentUserSlot: number;
  onClose: () => void;
  open: boolean;
}

export function SwapRequestModal({
  targetUserId,
  targetUserName,
  targetSlot,
  currentUserSlot,
  onClose,
  open,
}: SwapRequestModalProps) {
  const createSwap = useCreateSwap();
  const [requesting, setRequesting] = useState(false);

  const handleSubmit = async () => {
    setRequesting(true);
    try {
      await createSwap.mutateAsync(targetUserId);
      onClose();
    } finally {
      setRequesting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm dark:bg-slate-900">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Request Slot Swap
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Request to swap your slot #{currentUserSlot} with {targetUserName}&rsquo;s slot #{targetSlot}?
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-6">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21-3.582-4-8-4S0 4.79 0 7" />
              </svg>
              Your slot: #{currentUserSlot}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21-3.582-4-8-4S0 4.79 0 7" />
              </svg>
              {targetUserName}&rsquo;s slot: #{targetSlot}
            </span>
          </div>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={requesting || createSwap.isPending}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {requesting || createSwap.isPending ? 'Requesting...' : 'Request Swap'}
          </button>
        </div>
      </div>
    </div>
  );
}
