'use client';

import { useEffect, useState } from 'react';
import { OutgoingSwapBadge } from '@/features/queue-swap/components/OutgoingSwapBadge';
import { SwapRequestModal } from '@/features/queue-swap/components/SwapRequestModal';
import { useOutgoingSwaps } from '@/features/queue-swap/api';
import { useAuthStore } from '@/stores/auth';
import { useQueueStore } from '@/stores/queue';

interface QueueRow {
  id: string;
  queueName: string;
  position: number;
  checkedIn: boolean;
  userId: string;
  userName: string;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const queues = useQueueStore((state) => state.queues);
  const activeTicket = useQueueStore((state) => state.activeTicket);
  const [swapModal, setSwapModal] = useState<{
    targetUserId: string;
    targetUserName: string;
    targetSlot: number;
    currentUserSlot: number;
    open: boolean;
  } | null>(null);

  const { data: outgoingSwaps } = useOutgoingSwaps();

  const currentUserId = user?.id ?? '';
  const currentUserSlot = activeTicket ? activeTicket.entryId : null;
  const isInQueue = !!activeTicket;
  const isCheckedIn = false;

  // Build queue rows from all queues
  const [rows, setRows] = useState<QueueRow[]>([]);

  useEffect(() => {
    const allRows: QueueRow[] = [];
    queues.forEach((q) => {
      const waitingEntries = q.entries.filter((e) => e.status === 'WAITING');
      waitingEntries.forEach((entry, idx) => {
        allRows.push({
          id: entry.id,
          queueName: q.name,
          position: idx + 1,
          checkedIn: entry.checkedIn ?? false,
          userId: entry.id,
          userName: entry.name,
        });
      });
    });
    setRows(allRows);
  }, [queues]);

  const canRequestSwap = isInQueue && !isCheckedIn && currentUserSlot != null;

  const handleRequestSwap = (target: QueueRow) => {
    if (!canRequestSwap || target.userId === currentUserId) return;
    const hasPendingOutgoing = outgoingSwaps?.some(
      (s) => s.targetUserId === target.userId && s.status === 'PENDING',
    );
    if (hasPendingOutgoing || target.checkedIn) return;

    setSwapModal({
      targetUserId: target.userId,
      targetUserName: target.userName,
      targetSlot: target.position,
      currentUserSlot: Number(currentUserSlot),
      open: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Your queues and swap requests
            </p>
          </div>
          {outgoingSwaps && outgoingSwaps.filter((s) => s.status === 'PENDING').length > 0 && (
            <div className="flex gap-2">
              {outgoingSwaps
                .filter((s) => s.status === 'PENDING')
                .map((swap) => (
                  <OutgoingSwapBadge key={swap.id} swap={swap} />
                ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{row.queueName}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  row.checkedIn
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {row.checkedIn ? 'Checked In' : 'Waiting'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Position #{row.position}
              </p>
              {canRequestSwap && row.userId !== currentUserId && !row.checkedIn ? (
                <button
                  onClick={() => handleRequestSwap(row)}
                  className="w-full py-2 px-4 rounded-lg border border-brand-200 text-brand-600 text-sm font-medium hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
                >
                  Request Swap with {row.userName}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {swapModal && (
        <SwapRequestModal
          open={swapModal.open}
          targetUserId={swapModal.targetUserId}
          targetUserName={swapModal.targetUserName}
          targetSlot={swapModal.targetSlot}
          currentUserSlot={swapModal.currentUserSlot}
          onClose={() => setSwapModal(null)}
        />
      )}
    </div>
  );
}
