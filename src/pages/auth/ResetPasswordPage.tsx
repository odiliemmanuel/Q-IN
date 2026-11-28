import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconArrowLeft, IconCheckCircle, IconLock, IconEye, IconEyeOff } from '../../components/icons'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { AuthLayout } from './AuthLayout'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const notify = useUiStore((state) => state.notify)

  const token = searchParams.get('token') ?? searchParams.get('otp') ?? ''
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This password reset link is missing the required token. Please request a new one."
        footer={
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <IconArrowLeft className="h-4 w-4" />
            Request new code
          </button>
        }
      >
        <div className="text-center">
          <IconLock className="mx-auto h-12 w-12 text-rose-400" />
        </div>
      </AuthLayout>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!/^\d{4}$/.test(newPin)) {
      setError('PIN must be exactly 4 digits.')
      return
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPin)
      setSuccess(true)
      notify('PIN reset successfully', 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset PIN. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={success ? 'PIN reset successful' : 'Set new PIN'}
      subtitle={success
        ? 'Your PIN has been updated. You can now sign in with your new PIN.'
        : 'Enter your new 4-digit PIN below. The reset token is valid for 30 minutes.'}
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
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
            <IconCheckCircle className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            PIN updated
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
            You can now sign in with your new PIN.
          </p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <Input
            label="New PIN"
            name="newPin"
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="4-digit PIN"
            maxLength={4}
            icon={<IconLock className="h-4 w-4" />}
            value={newPin}
            onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            error={error ?? undefined}
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            }
          />

          <Input
            label="Confirm PIN"
            name="confirmPin"
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="Confirm 4-digit PIN"
            maxLength={4}
            icon={<IconLock className="h-4 w-4" />}
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            required
          />

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? 'Resetting…' : 'Reset PIN'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

import { Link } from 'react-router-dom'