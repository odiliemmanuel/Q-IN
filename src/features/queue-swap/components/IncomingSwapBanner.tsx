'use client';

import { useEffect, useState } from 'react';
import { useIncomingSwaps, useRespondSwap } from '../api';

interface IncomingSwapBannerProps {}

export function IncomingSwapBanner(_props: IncomingSwapBannerProps) {
  const { data: incomingSwaps, isLoading } = useIncomingSwaps();
  const respondSwap = useRespondSwap();
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'confirm' | 'reject' } | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const activeSwaps = incomingSwaps?.filter((s) => s.status === 'PENDING') ?? [];

  const swap = activeSwaps[0];
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!swap) return;
    const interval = setInterval(() => {
      const remaining = new Date(swap.expiresAt).getTime() - Date.now();
      setRemainingMs(remaining);
      setIsExpired(remaining <= 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [swap]);

  if (isLoading || !swap) return null;

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  const handleConfirm = async () => {
    setPendingAction({ id: swap.id, action: 'confirm' });
    try {
      await respondSwap.mutateAsync({ id: swap.id, action: 'confirm' });
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async () => {
    setPendingAction({ id: swap.id, action: 'reject' });
    try {
      await respondSwap.mutateAsync({ id: swap.id, action: 'reject' });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-in slide-in-from-bottom-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-lg dark:bg-amber-900/30 dark:border-amber-500/40">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white">Swap Request</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {swap.requesterName} wants to swap slot #{swap.requesterSlot} with your slot #{swap.targetSlot}.
            </p>
            {isExpired ? (
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">This request has expired.</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Expires in {minutes}m {seconds}s
              </p>
            )}
          </div>
          <div className="flex gap-2 ml-3">
            {!isExpired && pendingAction?.id !== swap.id ? (
              <button
                onClick={handleConfirm}
                disabled={respondSwap.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {respondSwap.isPending ? 'Confirming...' : 'Confirm'}
              </button>
            ) : null}
            {!isExpired && pendingAction?.id !== swap.id ? (
              <button
                onClick={handleReject}
                disabled={respondSwap.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50"
              >
                {respondSwap.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}