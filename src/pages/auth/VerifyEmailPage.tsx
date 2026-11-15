import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { IconMail, IconShield } from '../../components/icons'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { AuthLayout } from './AuthLayout'

const CODE_LENGTH = 6

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const verifyEmail = useAuthStore((state) => state.verifyEmail)
  const resendVerification = useAuthStore((state) => state.resendVerification)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const notify = useUiStore((state) => state.notify)

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [localError, setLocalError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const refs = useRef<Array<HTMLInputElement | null>>([])

  if (!user) return <Navigate to="/login" replace />
  if (user.emailVerified) return <Navigate to="/app/dashboard" replace />

  const code = digits.join('')

  const setDigit = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1)
    setLocalError(null)
    setDigits((current) => {
      const next = [...current]
      next[index] = char
      return next
    })
    if (char && index < CODE_LENGTH - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((char, index) => {
      next[index] = char
    })
    setDigits(next)
    refs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (code.length < CODE_LENGTH) {
      setLocalError('Enter the full 6-digit code.')
      return
    }
    setLocalError(null)
    try {
      await verifyEmail(user?.email ?? '', code)
      const state = useAuthStore.getState()
      if (state.error) {
        setLocalError(state.error)
        return
      }
      notify('Email verified — welcome to Q-In')
      navigate('/app/dashboard')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Verification failed. Try again.')
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await resendVerification(user?.email ?? '')
      notify('A new code is on its way', 'info')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not resend the code', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        user?.email
          ? `We sent a 6-digit code to ${user.email}.`
          : 'Enter the 6-digit code we sent to your inbox.'
      }
      footer={
        <span className="text-slate-500 dark:text-slate-400">
          Wrong account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Sign in instead
          </Link>
        </span>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-3 dark:border-brand-500/25 dark:bg-brand-500/10">
        <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <p className="text-[12.5px] leading-relaxed text-brand-900 dark:text-brand-200">
          <span className="font-semibold">Check your inbox:</span> enter the 6-digit code we emailed
          to {user?.email}. Didn&apos;t arrive? Use <span className="font-semibold">Resend code</span> below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                refs.current[index] = element
              }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              aria-label={`Digit ${index + 1}`}
              className="h-13 w-full rounded-xl border border-slate-300 bg-white text-center font-display text-lg font-semibold text-slate-900 transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              style={{ height: 52 }}
            />
          ))}
        </div>

        {localError || error ? (
          <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{localError ?? error}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={code.length < CODE_LENGTH}>
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
        <IconMail className="h-4 w-4" />
        Didn&apos;t get it?
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending}
          className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 disabled:opacity-60"
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </AuthLayout>
  )
}