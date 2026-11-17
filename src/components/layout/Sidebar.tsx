import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn, roleLabel } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { useQueueStore } from '../../stores/queue'
import { Logo } from '../Logo'
import { Avatar, Badge, Button } from '../ui'
import {
  IconClose,
  IconGrid,
  IconLogout,
  IconQueue,
  IconSettings,
  IconShield,
  IconSparkles,
  IconUsers,
  type IconProps,
} from '../icons'

interface NavItem {
  to: string
  label: string
  icon: (props: IconProps) => ReactNode
  roles?: Array<'ADMIN' | 'SUPER_ADMIN'>
  badge?: string
}

const WORKSPACE: NavItem[] = [
  { to: '/app/dashboard', label: 'Overview', icon: IconGrid },
  { to: '/app/queues', label: 'Queues', icon: IconQueue },
]

const MANAGE: NavItem[] = [
  { to: '/app/cohorts', label: 'Cohorts', icon: IconUsers, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/admin', label: 'Admin console', icon: IconShield, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/app/super-admin', label: 'Platform', icon: IconSparkles, roles: ['SUPER_ADMIN'] },
]

const ACCOUNT: NavItem[] = [{ to: '/app/settings', label: 'Settings', icon: IconSettings }]

export function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)
  const activeTicket = useQueueStore((state) => state.activeTicket)
  const queues = useQueueStore((state) => state.queues)
  const navigate = useNavigate()

  const role = user?.role ?? 'NATIVE'

  const visibleManage = MANAGE.filter((item) => !item.roles || item.roles.includes(role as 'ADMIN' | 'SUPER_ADMIN'))
  const waiting = queues.reduce(
    (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'WAITING').length,
    0,
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const content = (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <div className="flex items-center justify-between px-1">
        <Logo />
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        >
          <IconClose className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto scrollbar-slim">
        <NavGroup label="Workspace" items={WORKSPACE} onNavigate={() => setSidebarOpen(false)} />
        {visibleManage.length ? (
          <NavGroup label="Manage" items={visibleManage} onNavigate={() => setSidebarOpen(false)} />
        ) : null}
        <NavGroup label="Account" items={ACCOUNT} onNavigate={() => setSidebarOpen(false)} />

        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Workspace
              </p>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            {waiting} people waiting across {queues.filter((queue) => queue.isOpen).length} open queues.
          </p>
          {activeTicket ? (
            <Badge tone="brand" className="mt-2.5" dot>
              You&apos;re in a queue
            </Badge>
          ) : null}
        </div>
      </nav>

      <div className="rounded-2xl border border-slate-200 p-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Avatar name={user?.name ?? 'Guest'} src={user?.avatar} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
              {user?.name ?? 'Guest'}
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {roleLabel(role)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Sign out"
            className="h-8 w-8 shrink-0"
          >
            <IconLogout className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-950">
        {content}
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative h-full w-72 max-w-[85vw] animate-fade-in border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            {content}
          </aside>
        </div>
      ) : null}
    </>
  )
}

function NavGroup({
  label,
  items,
  onNavigate,
}: {
  label: string
  items: NavItem[]
  onNavigate: () => void
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
