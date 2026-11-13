import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn, timeAgo } from '../../lib/utils'
import { selectUnreadCount, useNotificationStore } from '../../stores/notifications'
import { Badge, EmptyState } from '../ui'
import { IconBell, IconCheck, IconCheckCircle, IconInfo, IconShield } from '../icons'

const TYPE_ICON = {
  QUEUE: IconCheckCircle,
  SYSTEM: IconInfo,
  ADMIN: IconShield,
}

const TYPE_TONE = {
  QUEUE: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  SYSTEM: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  ADMIN: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
}

export function NotificationBell() {
  const items = useNotificationStore((state) => state.items)
  const unread = useNotificationStore(selectUnreadCount)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const markRead = useNotificationStore((state) => state.markRead)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <IconBell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Notifications
              </p>
              {unread > 0 ? <Badge tone="danger">{unread} new</Badge> : null}
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <IconCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto scrollbar-slim">
            {items.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={<IconBell className="h-5 w-5" />} title="You're all caught up" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.slice(0, 8).map((item) => {
                  const Icon = TYPE_ICON[item.type]
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        className={cn(
                          'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
                          !item.read && 'bg-brand-50/40 dark:bg-brand-500/5',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            TYPE_TONE[item.type],
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            {!item.read ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /> : null}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                            {item.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
                            {timeAgo(item.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <Link
              to="/app/settings"
              onClick={() => setOpen(false)}
              className="text-[12px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Notification preferences
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
