'use client';

import { useEffect, useState } from 'react';
import { useCancelSwap } from '../api';

interface OutgoingSwapBadgeProps {
  swap: {
    id: string;
    targetUserName: string;
    requesterSlot: number;
    targetSlot: number;
    expiresAt: string;
    status: string;
  };
}

export function OutgoingSwapBadge({ swap }: OutgoingSwapBadgeProps) {
  const cancelSwap = useCancelSwap();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSwap.mutateAsync(swap.id);
    } finally {
      setCancelling(false);
    }
  };

  const expiresAt = new Date(swap.expiresAt).getTime();
  const [remainingMs, setRemainingMs] = useState(expiresAt - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setRemainingMs(expiresAt - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remainingMs <= 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium dark:bg-amber-900/30 dark:border-amber-500/40 dark:text-amber-200">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Outgoing swap to {swap.targetUserName} (#{swap.requesterSlot} ↔ #{swap.targetSlot})
      {isExpired ? (
        <span className="ml-1 text-rose-400">expired</span>
      ) : (
        <span className="ml-1">expires {Math.floor(remainingMs / 60000)}m {Math.floor((remainingMs % 60000) / 1000)}s</span>
      )}
      {!isExpired && !cancelling && !cancelSwap.isPending ? (
        <button
          onClick={handleCancel}
          className="ml-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
        >
          Cancel
        </button>
      ) : null}
      {cancelling || cancelSwap.isPending ? (
        <span className="ml-2 text-xs animate-pulse">Cancelling...</span>
      ) : null}
    </div>
  );
}
