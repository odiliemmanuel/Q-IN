import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/Button'
import { Input } from '@/components/common/Input'
import { useUIStore } from '@/stores/ui'

export function TOTPEntryScreen() {
  const [code, setCode] = useState<string>('')
  const [attempt, setAttempt] = useState<number>(0)
  const [remainingTime, setRemainingTime] = useState<number>(30)
  const navigate = useNavigate()
  const setUser = useAuthStore(state => state.setUser)
  const setTokens = useAuthStore(state => state.setTokens)
  const setRole = useAuthStore(state => state.setRole)
  const setAuthenticated = useAuthStore(state => state.setAuthenticated)

  // Countdown timer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (attempt > 0) {
      const startTime = Date.now()
      timeoutId = setInterval(() => {
        const elapsed = Date.now() - startTime
        const timeLeft = Math.max(30 - Math.floor(elapsed / 1000), 0)
        setRemainingTime(timeLeft)

        if (timeLeft <= 0) {
          setCode('')
          setRemainingTime(30)
          setAttempt(0)
          if (timeoutId) clearInterval(timeoutId)
        }
      }, 1000)
    }

    return () => {
      if (timeoutId) clearInterval(timeoutId)
    }
  }, [attempt])

  const handleVerify = async () => {
    // Remove any non-digit characters
    const cleanCode = code.replace(/\D/g, '').substring(0, 6)

    if (cleanCode.length !== 6) {
      // Show error - invalid code length
      return
    }

    setAttempt(prev => prev + 1)
    setRemainingTime(30)

    try {
      const data = await authApi.verifyEmail({ code: cleanCode })
      setTokens(data.tokens || data)
      const user: User = {
        id: data.user?.id || data.id,
        name: data.user?.name || data.name || '',
        email: data.user?.email || data.email || '',
        role: data.user?.role || data.role || 'NATIVE',
        emailVerified: data.user?.emailVerified || data.emailVerified || false,
        createdAt: data.user?.createdAt || data.createdAt || new Date().toISOString(),
      }
      setUser(user)
      setRole(data.user?.role || data.role || 'NATIVE')
      setAuthenticated(true)

      // Navigate based on role
      let redirectPath = '/dashboard/cohorts/queues'
      if (role === 'SUPER_ADMIN') {
        redirectPath = '/dashboard/super-admin'
      } else if (role === 'ADMIN') {
        redirectPath = '/dashboard/admin'
      }

      navigate(redirectPath, { replace: true })
    } catch (error: any) {
      // Verification failed, decrement attempt and show error
      console.error('TOTP verification failed:', error)
    }
  }

  // Auto-advance between input digits
  const handleInputChange = (index: number, value: string) => {
    const newCode = [...code].map((_, i) => {
      if (i === index) return value
      return code[i] || ''
    })
    setCode(newCode.join(''))

    if (value && index < 5) {
      // Auto-advance to next input
    } else if (!value && index > 0) {
      // Go back if backspace
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-panel rounded-lg p-8 max-w-md w-full shadow-lg border border-border">
        <h2 className="text-2xl font-semibold text-primary mb-6">Verify Identity</h2>

        <p className="text-muted mb-6 text-center">
          Enter the 6-digit code sent to your email. Codes are valid for 30 seconds.
        </p>

        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <Input
              key={i}
              type="number"
              maxLength="1"
              value={code[i] || ''}
              onChange={(e) => handleInputChange(i, e.target.value)}
              className="w-10 h-10 rounded border border-border text-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center"
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleVerify}
            className="w-full py-3 px-4 rounded bg-primary text-white font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={remainingTime > 0 || attempt >= 3}
          >
            {attempt > 0 ? `Verify (${remainingTime}s remaining)` : 'Verify Code'}
          </button>
        </div>

        {attempt > 0 && (
          <p className="mt-4 text-center text-sm text-muted">
            Invalid code. {remainingTime > 0 ? `Try again in ${remainingTime}s.` : 'Code expired. Resend?'}
          </p>
        )}

        {attempt >= 3 && (
          <p className="mt-4 text-center text-sm text-destructive">
            Too many failed attempts. Please try again later.
          </p>
        )}
      </div>
    </div>
  )
}