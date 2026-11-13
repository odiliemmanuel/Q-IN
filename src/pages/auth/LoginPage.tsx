import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconEye, IconEyeOff, IconLock, IconMail } from '../../components/icons'
import { DEMO_ACCOUNTS, useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { roleLabel } from '../../lib/utils'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loginDemo = useAuthStore((state) => state.loginDemo)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const user = useAuthStore((state) => state.user)
  const notify = useUiStore((state) => state.notify)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user?.emailVerified) navigate('/app/dashboard', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearError()
    await login(email, password)
    const nextUser = useAuthStore.getState().user
    if (!nextUser) return
    notify(`Welcome back, ${nextUser.name.split(' ')[0]}`)
    navigate(nextUser.emailVerified ? '/app/dashboard' : '/verify-email')
  }

  const handleDemo = (role: (typeof DEMO_ACCOUNTS)[number]['role']) => {
    loginDemo(role)
    notify(`Signed in as ${roleLabel(role).toLowerCase()}`)
    navigate('/app/dashboard')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your position and manage your queues."
      footer={
        <span className="text-slate-500 dark:text-slate-400">
          New to Q-In?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<IconMail className="h-4 w-4" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={<IconLock className="h-4 w-4" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-[13px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Forgot password?
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-7">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Or try a demo account
          </span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => handleDemo(account.role)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/60 dark:border-slate-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
            >
              <span className="block text-[12px] font-semibold text-slate-900 dark:text-white">
                {account.label}
              </span>
              <span className="block truncate text-[10.5px] text-slate-500 dark:text-slate-400">
                {account.email}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
