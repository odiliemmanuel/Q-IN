import { type ServiceTimerStatus } from '../../realtime/queueWebSocket'
import { useServiceTimer, formatTime, getTimerColor, getTimerBgColor } from '../../hooks/useServiceTimer'
import { cn } from '../../lib/utils'

interface ServiceTimerDisplayProps {
  userId: string
  queueId: string
  initialStatus?: ServiceTimerStatus | null
  className?: string
}

export function ServiceTimerDisplay({ userId, queueId, initialStatus, className }: ServiceTimerDisplayProps) {
  const { status, remainingSeconds, isTimerRunning, hasServiceTimer, checkOut } = useServiceTimer(userId, initialStatus)

  if (!hasServiceTimer) return null

  const totalAllowedMinutes = status?.totalAllowedMinutes ?? ((status?.serviceTimeMinutes ?? 0) + (status?.gracePeriodMinutes ?? 0))
  const progress = totalAllowedMinutes > 0 ? (1 - remainingSeconds / (totalAllowedMinutes * 60)) * 100 : 0

  return (
    <div className={cn('rounded-xl border p-4 transition-all duration-300', getTimerBgColor(remainingSeconds), className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-lg font-bold tabular-nums', getTimerColor(remainingSeconds))}>
            {formatTime(remainingSeconds)}
          </span>
          {isTimerRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </div>
        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
          <div>Service: {status?.serviceTimeMinutes ?? 0} min</div>
          <div>Grace: {status?.gracePeriodMinutes ?? 0} min</div>
        </div>
      </div>

      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-linear"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: remainingSeconds <= 10 ? '#ef4444' : remainingSeconds <= 60 ? '#f59e0b' : '#22c55e',
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {status?.isAtFront ? 'Your service time' : 'Front user service time'}
        </span>
        {status?.isAtFront && isTimerRunning && (
          <button
            type="button"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            onClick={() => checkOut(queueId)}
          >
            Check Out
          </button>
        )}
      </div>
    </div>
  )
}