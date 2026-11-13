import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { IconMoon, IconSun } from '../../components/icons'
import { useUiStore } from '../../stores/ui'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" aria-label="Q-In home" className="rounded-lg">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-[400px] animate-fade-up">
          <h2 className="font-display text-[26px] font-semibold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </main>

      <footer className="pb-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Q-In · Queueni. All rights reserved.
      </footer>
    </div>
  )
}
