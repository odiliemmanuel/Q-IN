import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Select } from '../../components/ui'
import { FaceCapture } from '../../components/FaceCapture'
import { IconArrowLeft, IconArrowRight, IconEye, IconEyeOff, IconLock, IconMail, IconSparkles, IconUser } from '../../components/icons'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { fetchCohorts, type BackendCohort, type Gender, uploadCaricature } from '../../lib/api'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const notify = useUiStore((state) => state.notify)

  const [step, setStep] = useState<1 | 2>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [gender, setGender] = useState<Gender | ''>('')
  const [cohortId, setCohortId] = useState('')
  const [cohorts, setCohorts] = useState<BackendCohort[]>([])
  const [cohortsError, setCohortsError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(true)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  // Cohorts come from the backend (public endpoint) and are required to sign up.
  useEffect(() => {
    let cancelled = false
    fetchCohorts()
      .then((list) => {
        if (cancelled) return
        setCohorts(list)
        setCohortsError(null)
        if (list.length && !cohortId) setCohortId(list[0].id)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setCohortsError(
          err instanceof Error && err.message
            ? `Could not load cohorts: ${err.message}`
            : 'Could not load cohorts right now — the backend may be waking up. Retrying…',
        )
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goStep2 = (event: React.FormEvent) => {
    event.preventDefault()
    clearError()
    setLocalError(null)

    if (firstName.trim().length < 2) {
      setLocalError('Please enter your first name.')
      return
    }
    if (lastName.trim().length < 2) {
      setLocalError('Please enter your last name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Enter a valid email address.')
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setLocalError('Your PIN must be exactly 4 digits.')
      return
    }
    if (pin !== confirmPin) {
      setLocalError('PINs do not match.')
      return
    }
    if (gender !== 'MALE' && gender !== 'FEMALE') {
      setLocalError('Select your gender.')
      return
    }
    if (!cohortId) {
      setLocalError('Choose your cohort to continue.')
      return
    }
    if (!agreed) {
      setLocalError('Please accept the terms to continue.')
      return
    }

    setLocalError(null)
    setStep(2)
  }

  const handleSubmit = async (confirmedAvatar?: string) => {
    const useAvatar = confirmedAvatar ?? avatar
    clearError()
    setLocalError(null)
    await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userName: email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, ''),
      pin,
      email: email.trim().toLowerCase(),
      phoneNumber: '',
      whatsappNumber: '',
      gender: (gender || 'MALE') as Gender,
      cohortId,
    })
    const user = useAuthStore.getState().user
    if (!user) return
    if (useAvatar) {
      try {
        await uploadCaricature(user.id, useAvatar)
      } catch {
        // Ignore caricature upload errors
      }
    }
    notify('Account created — check your inbox for the verification code')
    navigate('/verify-email')
  }

  return (
    <AuthLayout
      title={step === 1 ? 'Create your account' : 'Add your face'}
      subtitle={
        step === 1
          ? 'Join your cohort and stop guessing when your turn is.'
          : 'We turn your photo into a caricature so others can spot you on the queue.'
      }
      footer={
        <span className="text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Sign in
          </Link>
        </span>
      }
    >
      {step === 1 ? (
        <form onSubmit={goStep2} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
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
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="PIN"
              name="pin"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="••••"
              maxLength={4}
              icon={<IconLock className="h-4 w-4" />}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              hint="4 digits."
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
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Repeat PIN"
              maxLength={4}
              icon={<IconLock className="h-4 w-4" />}
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Gender"
              name="gender"
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender | '')}
              required
            >
              <option value="">Select…</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </Select>
            <Select
              label="Cohort"
              name="cohort"
              value={cohortId}
              onChange={(event) => setCohortId(event.target.value)}
              required
            >
              {cohorts.length ? (
                cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </option>
                ))
              ) : (
                <option value="">{cohortsError ? 'Loading…' : 'No cohorts yet'}</option>
              )}
            </Select>
          </div>

          {cohortsError ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              {cohortsError}
            </p>
          ) : null}

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

          <Button
            type="submit"
            size="lg"
            className="w-full"
            rightIcon={<IconArrowRight className="h-4 w-4" />}
            disabled={Boolean(cohortsError) || cohorts.length === 0}
          >
            Next: add your photo
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <FaceCapture
            busy={loading}
            onConfirm={(dataUrl) => {
              setAvatar(dataUrl)
              void handleSubmit(dataUrl)
            }}
          />

          {localError || error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {localError ?? error}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLocalError(null)
                setStep(1)
              }}
              leftIcon={<IconArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <p className="flex flex-1 items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
              <IconSparkles className="h-3.5 w-3.5 text-brand-600" />
              Everything stays on your device — only the caricature is uploaded.
            </p>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}