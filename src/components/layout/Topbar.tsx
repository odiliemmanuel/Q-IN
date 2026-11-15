import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn, roleLabel } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { Avatar } from '../ui'
import { NotificationBell } from './NotificationBell'
import {
  IconChevronDown,
  IconLogout,
  IconMenu,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSun,
  IconUser,
} from '../icons'

const TITLES: Record<string, string> = {
  '/app/dashboard': 'Overview',
  '/app/queues': 'Queues',
  '/app/cohorts': 'Cohorts',
  '/app/admin': 'Admin console',
  '/app/super-admin': 'Platform',
  '/app/settings': 'Settings',
}

export function Topbar() {
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const title =
    TITLES[location.pathname] ??
    (location.pathname.startsWith('/app/queues/') ? 'Queue detail' : 'Q-In')

  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [menuOpen])

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    navigate(value ? `/app/queues?q=${encodeURIComponent(value)}` : '/app/queues')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Open navigation"
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-slate-900 dark:text-white">
            {title}
          </p>
        </div>

        <form onSubmit={submitSearch} className="ml-auto hidden md:block">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search queues, cohorts…"
              className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Search"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
          </button>

          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-expanded={menuOpen}
              aria-label="Open account menu"
            >
              <Avatar name={user?.name ?? 'Guest'} src={user?.avatar} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[120px] truncate text-[12px] font-semibold text-slate-900 dark:text-white">
                  {user?.name ?? 'Guest'}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  {roleLabel(user?.role ?? 'NATIVE')}
                </span>
              </span>
              <IconChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-64 animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <MenuLink to="/app/settings" icon={<IconUser className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                    Profile
                  </MenuLink>
                  <MenuLink
                    to="/app/settings"
                    icon={<IconSettings className="h-4 w-4" />}
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </MenuLink>
                </div>
                <div className="border-t border-slate-100 p-1.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                      navigate('/login')
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium',
                      'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10',
                    )}
                  >
                    <IconLogout className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

function MenuLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {icon}
      {children}
    </Link>
  )
}
