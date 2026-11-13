import { cn } from '../lib/utils'

export function Logo({
  className,
  showWordmark = true,
  inverted = false,
}: {
  className?: string
  showWordmark?: boolean
  inverted?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden="true">
          <path d="M5 7h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M5 12h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
          <path d="M5 17h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
          <circle cx="17.5" cy="15.5" r="3" stroke="currentColor" strokeWidth="2.2" />
          <path d="m19.7 17.7 2 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-lg font-bold tracking-tight',
              inverted ? 'text-white' : 'text-slate-900 dark:text-white',
            )}
          >
            Q-In
          </span>
          <span
            className={cn(
              'mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em]',
              inverted ? 'text-white/60' : 'text-slate-400 dark:text-slate-500',
            )}
          >
            Queue management
          </span>
        </span>
      ) : null}
    </div>
  )
}
