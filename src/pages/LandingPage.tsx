import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Avatar, Badge, Button, Card } from '../components/ui'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import {
  IconArrowRight,
  IconBell,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconMoon,
  IconQueue,
  IconShield,
  IconSparkles,
  IconSun,
  IconUsers,
  IconWebhook,
} from '../components/icons'

const FEATURES = [
  {
    icon: IconClock,
    title: 'Live positions',
    text: 'Everyone sees their number in line and a realistic wait estimate, updated as people are served.',
  },
  {
    icon: IconUsers,
    title: 'Cohorts & roles',
    text: 'Group people into cohorts. Members join lines, admins run them, super admins see the whole platform.',
  },
  {
    icon: IconShield,
    title: 'Admin controls',
    text: 'Call the next person, skip no-shows, open or close a queue, and invite fellow admins in a couple of clicks.',
  },
  {
    icon: IconBell,
    title: 'Smart notifications',
    text: 'A bell with unread counts and a nudge when your turn is close, so nobody loses their spot.',
  },
  {
    icon: IconWebhook,
    title: 'Webhooks',
    text: 'Push queue events — opened, closed, joined, called, served — straight into your own systems.',
  },
  {
    icon: IconMoon,
    title: 'Light & dark',
    text: 'A calm interface in both themes, with reduced-motion support and keyboard-friendly dialogs.',
  },
]

const STEPS = [
  {
    title: 'Create your workspace',
    text: 'Sign up as a member, or sign in with a demo account to explore every role instantly.',
  },
  {
    title: 'Join a queue',
    text: 'Pick an open queue in your cohort and get a position and wait estimate right away.',
  },
  {
    title: 'Get called forward',
    text: 'Admins serve the line while your position updates automatically — no hovering required.',
  },
]

const PREVIEW_ROWS = [
  { name: 'Chinedu Eze', position: 'Now serving' },
  { name: 'Amara Nwosu', position: '#2' },
  { name: 'Adaeze Nwankwo', position: '#3' },
  { name: 'Femi Adeyemi', position: '#4' },
]

export function LandingPage() {
  const user = useAuthStore((state) => state.user)
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Q-In home" className="rounded-lg">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-slate-600 md:flex dark:text-slate-300">
            <a href="#features" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              How it works
            </a>
            <a href="#roles" className="transition-colors hover:text-slate-900 dark:hover:text-white">
              Roles
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
            </button>
            {user ? (
              <Link to="/app/dashboard">
                <Button size="sm" rightIcon={<IconArrowRight className="h-4 w-4" />}>
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-grid opacity-[0.04] dark:opacity-[0.06]"
            aria-hidden="true"
          />
          <div
            className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-600/15"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-24 lg:px-8">
            <div className="animate-fade-up">
              <Badge tone="brand" className="mx-auto lg:mx-0">
                <IconQueue className="h-3.5 w-3.5" />
                Built for real-world queues
              </Badge>

              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 text-balance sm:text-5xl lg:text-[56px] dark:text-white">
                Less waiting.
                <br />
                <span className="bg-linear-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent dark:from-brand-400 dark:to-violet-400">
                  More doing.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                Q-In gives cohorts a live view of every line, so nobody has to stand around guessing
                when their turn will come. Positions, wait estimates and admin tools — in one calm
                workspace.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link to="/app/dashboard">
                    <Button size="lg" rightIcon={<IconArrowRight className="h-4 w-4" />}>
                      Open your workspace
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" rightIcon={<IconArrowRight className="h-4 w-4" />}>
                        Create free account
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button size="lg" variant="outline">
                        Sign in
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <p className="mt-4 flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
                <IconCheckCircle className="h-4 w-4 text-emerald-500" />
                Try it instantly with a demo account — no setup required.
              </p>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                {[
                  { value: '3 roles', label: 'Member, admin, super admin' },
                  { value: '1 tap', label: 'To join any open queue' },
                  { value: '0 setup', label: 'Runs entirely in your browser' },
                ].map((stat) => (
                  <div key={stat.value}>
                    <dt className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                      {stat.value}
                    </dt>
                    <dd className="mt-0.5 text-[11.5px] leading-snug text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Preview card */}
            <div className="relative animate-fade-up lg:justify-self-end">
              <div
                className="absolute -inset-6 rounded-[32px] bg-linear-to-br from-brand-500/15 via-violet-500/10 to-transparent blur-2xl"
                aria-hidden="true"
              />
              <Card className="relative w-full max-w-md p-5 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                      Lab Equipment Checkout
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                      Frontend Engineering · Cohort 12
                    </p>
                  </div>
                  <Badge tone="success">Open</Badge>
                </div>

                <div className="mt-4 space-y-2">
                  {PREVIEW_ROWS.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-800"
                    >
                      <Avatar name={row.name} size="sm" />
                      <span className="flex-1 text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        {row.name}
                      </span>
                      <span className="text-[11.5px] font-semibold text-brand-600 dark:text-brand-400">
                        {row.position}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
                  {[
                    { label: 'In line', value: '9' },
                    { label: 'Capacity', value: '40' },
                    { label: 'Avg wait', value: '6m' },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {metric.label}
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/70 py-16 lg:py-20 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge tone="violet">
                <IconSparkles className="h-3.5 w-3.5" />
                Features
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Everything a queue needs, nothing it doesn&apos;t
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                Built around one idea: people should know their turn is coming without having to
                stand in a hallway watching the door.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="p-5 transition-shadow hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {feature.text}
                    </p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how-it-works" className="scroll-mt-20 py-16 lg:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge tone="brand">
                <IconCheck className="h-3.5 w-3.5" />
                How it works
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                From sign-up to served in three steps
              </h2>
            </div>

            <ol className="mt-10 grid gap-4 lg:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Card className="h-full p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-display text-[13px] font-bold text-white dark:bg-white dark:text-slate-900">
                      {index + 1}
                    </span>
                    <h3 className="mt-4 font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {step.text}
                    </p>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- Roles ---------------- */}
        <section id="roles" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/70 py-16 lg:py-20 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge tone="success">
                <IconUsers className="h-3.5 w-3.5" />
                Roles
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                One workspace, three levels of access
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {[
                {
                  title: 'Member',
                  email: 'member@qin.app',
                  points: ['Join any open queue', 'Track position and wait', 'Get notified near the front'],
                },
                {
                  title: 'Admin',
                  email: 'admin@qin.app',
                  points: ['Everything members can do', 'Call, skip and close queues', 'Invite and manage admins'],
                },
                {
                  title: 'Super admin',
                  email: 'super@qin.app',
                  points: ['Platform-wide analytics', 'System health at a glance', 'Full access to every tool'],
                },
              ].map((role, index) => (
                <Card key={role.title} className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                      {role.title}
                    </h3>
                    <Badge tone={index === 2 ? 'violet' : index === 1 ? 'brand' : 'neutral'}>
                      {role.title.toLowerCase()}
                    </Badge>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-[13px] text-slate-600 dark:text-slate-400">
                        <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-slate-100 pt-3 font-mono text-[11.5px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    {role.email}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-800 via-brand-700 to-brand-950 p-8 text-center sm:p-12">
              <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
              <div
                className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-brand-400/25 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <h2 className="font-display text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
                  Ready to stop standing in line?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-brand-100/85">
                  Create an account or jump straight into the demo workspace and see every role in
                  action.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {user ? (
                    <Link to="/app/dashboard">
                      <Button
                        size="lg"
                        variant="white"
                        rightIcon={<IconArrowRight className="h-4 w-4" />}
                      >
                        Open your workspace
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/register">
                        <Button
                          size="lg"
                          variant="white"
                          rightIcon={<IconArrowRight className="h-4 w-4" />}
                        >
                          Create free account
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button size="lg" variant="outlineInverse">
                          Sign in
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-slate-100 py-8 dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p className="text-[12px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Q-In · Queueni. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[12.5px] font-medium">
            <Link to="/login" className="text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              Member sign in
            </Link>
            <Link to="/register" className="text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              Create account
            </Link>
            <Link to="/admin/login" className="text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              Admin sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
