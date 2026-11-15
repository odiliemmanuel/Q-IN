import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Select } from '../../components/ui'
import { IconEye, IconEyeOff, IconLock, IconMail, IconUser, IconPhone, IconMessageCircle } from '../../components/icons'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { cohortsApi } from '../../api'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const notify = useUiStore((state) => state.notify)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [userName, setUserName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE')
  const [cohortId, setCohortId] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string }>>([])
  const [cohortsLoading, setCohortsLoading] = useState(true)

  useEffect(() => {
    cohortsApi.getAllCohorts()
      .then(data => {
        setCohorts(data.filter(c => c.isActive))
      })
      .catch(() => {})
      .finally(() => setCohortsLoading(false))
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearError()
    setLocalError(null)

    if (pin !== confirmPin) {
      setLocalError('PINs do not match.')
      return
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setLocalError('PIN must be exactly 4 digits.')
      return
    }
    if (!cohortId) {
      setLocalError('Please select a cohort.')
      return
    }
    if (!agreed) {
      setLocalError('Please accept the terms to continue.')
      return
    }

    await register({
      firstName,
      lastName,
      userName,
      pin,
      email,
      phoneNumber,
      whatsappNumber,
      gender,
      cohortId,
    })
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            name="firstName"
            autoComplete="given-name"
            placeholder="Ada"
            icon={<IconUser className="h-4 w-4" />}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <Input
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            placeholder="Okafor"
            icon={<IconUser className="h-4 w-4" />}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>

        <Input
          label="Username"
          name="userName"
          autoComplete="username"
          placeholder="adaokafor"
          icon={<IconUser className="h-4 w-4" />}
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone number"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+234 800 000 0000"
            icon={<IconPhone className="h-4 w-4" />}
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
          />
          <Input
            label="WhatsApp number"
            name="whatsappNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+234 800 000 0000"
            icon={<IconMessageCircle className="h-4 w-4" />}
            value={whatsappNumber}
            onChange={(event) => setWhatsappNumber(event.target.value)}
          />
        </div>

        <Select
          label="Gender"
          name="gender"
          value={gender}
          onChange={(event) => setGender(event.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
          required
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </Select>

        <Select
          label="Cohort"
          name="cohortId"
          value={cohortId}
          onChange={(event) => setCohortId(event.target.value)}
          required
          disabled={cohortsLoading}
        >
          {cohortsLoading ? (
            <option value="" disabled>Loading cohorts...</option>
          ) : (
            <>
              <option value="" disabled>Select your cohort</option>
              {cohorts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </>
          )}
        </Select>

        <Input
          label="PIN (4 digits)"
          name="pin"
          type={showPin ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="1234"
          icon={<IconLock className="h-4 w-4" />}
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          required
          maxLength={4}
          hint="Use exactly 4 digits."
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

        <Input
          label="Confirm PIN"
          name="confirmPin"
          type={showPin ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="1234"
          icon={<IconLock className="h-4 w-4" />}
          value={confirmPin}
          onChange={(event) => setConfirmPin(event.target.value)}
          required
          maxLength={4}
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
