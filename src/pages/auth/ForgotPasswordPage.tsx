import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconArrowLeft, IconCheckCircle, IconMail } from '../../components/icons'
import { useUiStore } from '../../stores/ui'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const notify = useUiStore((state) => state.notify)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError(null)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      notify('Reset link sent (demo)', 'info')
    }, 600)
  }

  return (
    <AuthLayout
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent
          ? `If an account exists for ${email}, a reset link is on its way.`
          : 'Enter your email and we will send you a secure reset link.'
      }
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
            <IconCheckCircle className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Reset link sent
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
            The link expires in 30 minutes. Check your spam folder if you don&apos;t see it.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={<IconMail className="h-4 w-4" />}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            error={error ?? undefined}
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
