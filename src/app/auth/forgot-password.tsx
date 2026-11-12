import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api-client'
import { Button } from '@/components/Button'
import { Input } from '@/components/common/Input'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await authApi.forgotPassword({ email })
      // Show success message - in a real app, show a proper alert
      setError('A password reset link has been sent to your email')
      navigate('/auth/reset-password', { state: { token: 'placeholder' } })
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-panel rounded-lg p-8 max-w-md w-full shadow-lg border border-border">
        <h2 className="text-2xl font-semibold text-primary mb-6 text-center">Forgot Password</h2>

        {error && (
          <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 px-4 rounded bg-primary text-white font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}