import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconEye, IconEyeOff, IconLock, IconUsers, IconUser } from '../../components/icons'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const user = useAuthStore((state) => state.user)
  const notify = useUiStore((state) => state.notify)

  const [userIdentifier, setUserIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    if (user?.emailVerified) navigate('/app/dashboard', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearError()
    await login(userIdentifier, pin)
    const nextUser = useAuthStore.getState().user
    if (!nextUser) return
    notify(`Welcome back, ${nextUser.name.split(' ')[0]}`)
    navigate(nextUser.emailVerified ? '/app/dashboard' : '/verify-email')
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
      <div className="mb-6 flex items-center gap-3 text-brand-600 dark:text-brand-400">
        <IconUsers className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Member Portal</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Username or Email"
          name="userIdentifier"
          type="text"
          autoComplete="username"
          placeholder="Enter your username or email"
          icon={<IconUser className="h-4 w-4" />}
          value={userIdentifier}
          onChange={(event) => setUserIdentifier(event.target.value)}
          required
        />

        <Input
          label="PIN"
          name="pin"
          type={showPin ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your 4-digit PIN"
          icon={<IconLock className="h-4 w-4" />}
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          required
          maxLength={4}
          trailing={
            <button
              type="button"
              onClick={() => setShowPin((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showPin ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
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
            Forgot PIN?
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
    </AuthLayout>
  )
}