import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconEye, IconEyeOff, IconLock, IconMail, IconUser } from '../../components/icons'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const notify = useUiStore((state) => state.notify)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearError()
    setLocalError(null)

    if (password !== confirm) {
      setLocalError('Passwords do not match.')
      return
    }
    if (!agreed) {
      setLocalError('Please accept the terms to continue.')
      return
    }

    await register(name, email, password)
    if (!useAuthStore.getState().user) return
    notify('Account created — verify your email to continue')
    navigate('/verify-email')
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your cohort and stop guessing when your turn is."
      footer={
        <span className="text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Ada Okafor"
          icon={<IconUser className="h-4 w-4" />}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          icon={<IconLock className="h-4 w-4" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          hint="Use 6 or more characters."
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

        <Input
          label="Confirm password"
          name="confirm"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          icon={<IconLock className="h-4 w-4" />}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />

        <label className="flex items-start gap-2.5 text-[13px] text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
          />
          <span>
            I agree to the <span className="font-medium text-slate-800 dark:text-slate-200">Terms</span> and{' '}
            <span className="font-medium text-slate-800 dark:text-slate-200">Privacy Policy</span>.
          </span>
        </label>

        {localError || error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {localError ?? error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
