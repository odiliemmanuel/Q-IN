import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Avatar, Badge } from '../../components/ui'
import { useUiStore } from '../../stores/ui'
import {
  IconCheckCircle,
  IconClock,
  IconMoon,
  IconQueue,
  IconSun,
  IconUsers,
} from '../../components/icons'

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
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr] dark:bg-slate-950">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-800 via-brand-700 to-brand-950 p-10 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div
          className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <Logo inverted />
        </div>

        <div className="relative mt-16 max-w-md">
          <Badge tone="brand" className="bg-white/10 text-white ring-white/20">
            <IconQueue className="h-3.5 w-3.5" />
            Built for real-world queues
          </Badge>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.1] tracking-tight text-white text-balance">
            Less waiting.
            <br />
            More doing.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-brand-100/80">
            Q-In gives cohorts a live view of every line, so nobody has to stand around guessing
            when their turn will come.
          </p>

          <ul className="mt-8 space-y-3.5">
            {[
              { icon: IconClock, text: 'Live positions and accurate wait estimates' },
              { icon: IconUsers, text: 'Cohorts, queues and roles in one workspace' },
              { icon: IconCheckCircle, text: 'Admin tools for calling, skipping and closing lines' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <li key={item.text} className="flex items-center gap-3 text-[13.5px] text-white/85">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.text}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Floating preview card */}
        <div className="relative mt-auto pt-10">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-white">Lab Equipment Checkout</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { name: 'Chinedu Eze', position: 'Now serving' },
                { name: 'Amara Nwosu', position: '#2' },
                { name: 'You', position: '#3' },
              ].map((row) => (
                <div
                  key={row.name}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-white/10"
                >
                  <Avatar name={row.name} size="xs" />
                  <span className="flex-1 text-[12px] font-medium text-white/90">{row.name}</span>
                  <span className="text-[11px] font-semibold text-brand-200">{row.position}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[11px] text-white/45">
            © {new Date().getFullYear()} Q-In · Queueni. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <div className="animate-fade-up">
            <h2 className="font-display text-[26px] font-semibold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : null}
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[400px] text-center text-[11px] text-slate-400 dark:text-slate-500">
          <Link to="/login" className="hover:text-slate-600 dark:hover:text-slate-300">
            Q-In demo workspace
          </Link>
          <span className="mx-2">·</span>
          <span>No backend required</span>
        </div>
      </main>
    </div>
  )
}
