import { create } from 'zustand'
import type { Role, User } from '../lib/types'
import { loadJSON, saveJSON } from '../lib/persist'
import { uid } from '../lib/utils'
import {
  ApiError,
  loadTokens,
  loginUser,
  registerUser,
  resendVerification,
  saveTokens,
  uploadCaricature,
  verifyEmailAndLogin,
  logoutUser,
  type Gender,
  type RegisterPayload,
} from '../lib/api'

const USER_KEY = 'qin:user'
const PENDING_KEY = 'qin:pending-registration'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function roleForEmail(email: string): Role {
  const value = email.toLowerCase()
  if (value.startsWith('super')) return 'SUPER_ADMIN'
  if (value.startsWith('admin')) return 'ADMIN'
  return 'NATIVE'
}

function nameForEmail(email: string): string {
  const handle = email.split('@')[0] ?? 'member'
  return handle
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Map a backend role string ("NATIVE", "ROLE_ADMIN", …) to the frontend Role. */
function roleFromBackend(role: string | undefined): Role {
  const value = (role ?? '').toUpperCase().replace(/^ROLE_/, '')
  if (value === 'ADMIN') return 'ADMIN'
  if (value === 'SUPER_ADMIN') return 'SUPER_ADMIN'
  return 'NATIVE'
}

/** The data collected on the signup form, kept between registration and verification. */
export interface PendingRegistration {
  email: string
  firstName: string
  lastName: string
  userName: string
  /** 4-digit PIN as entered on the form (kept only for the local demo fallback). */
  pin: string
  gender: Gender
  cohortId: string
  avatar: string | null
}

export function loadPendingRegistration(): PendingRegistration | null {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null') as PendingRegistration | null
  } catch {
    return null
  }
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, pin: string) => Promise<void>
  register: (payload: Omit<PendingRegistration, 'avatar'>, avatar: string | null) => Promise<void>
  verifyEmail: (otp: string) => Promise<void>
  resendVerification: () => Promise<void>
  verifyEmailLocal: () => void
  updateProfile: (patch: Partial<Pick<User, 'name' | 'avatar'>>) => void
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadJSON<User | null>(USER_KEY, null),
  loading: false,
  error: null,

  login: async (email, pin) => {
    set({ loading: true, error: null })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.trim().length < 3) {
      set({ loading: false, error: 'Enter a valid email or username.' })
      return
    }
    if (pin.length !== 4) {
      set({ loading: false, error: 'Your PIN is 4 digits.' })
      return
    }

    try {
      const response = await loginUser(email.trim(), pin)
      const tokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userId: response.userId,
      }
      saveTokens(tokens)

      const user: User = {
        id: response.userId,
        name: nameForEmail(email.includes('@') ? email : `${email}@queueni.app`),
        email: email.includes('@') ? email.toLowerCase() : '',
        role: roleFromBackend(response.role),
        emailVerified: true,
        createdAt: new Date().toISOString(),
        avatar: loadJSON<User | null>(USER_KEY, null)?.avatar,
      }
      saveJSON(USER_KEY, user)
      set({ user, loading: false, error: null })
    } catch (error) {
      if (error instanceof ApiError && error.status >= 400) {
        set({ loading: false, error: error.message })
        return
      }
      // Backend unreachable (Render cold start / offline): fall back to the
      // local demo flow so the app stays usable.
      await sleep(350)
      const user: User = {
        id: uid('usr'),
        name: nameForEmail(email.includes('@') ? email : `${email}@queueni.app`),
        email: email.includes('@') ? email.toLowerCase() : '',
        role: roleForEmail(email),
        emailVerified: true,
        createdAt: new Date().toISOString(),
      }
      saveJSON(USER_KEY, user)
      set({ user, loading: false, error: null })
    }
  },

  register: async (payload, avatar) => {
    set({ loading: true, error: null })

    const pending: PendingRegistration = { ...payload, avatar }
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending))

    try {
      const body: RegisterPayload = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        userName: payload.userName,
        pin: payload.pin,
        email: payload.email,
        gender: payload.gender,
        cohortId: payload.cohortId,
      }
      const response = await registerUser(body)
      pending.avatar = avatar
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending))

      const user: User = {
        id: response.userId,
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        email: payload.email.toLowerCase(),
        role: 'NATIVE',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        avatar: avatar ?? undefined,
      }
      saveJSON(USER_KEY, user)
      set({ user, loading: false, error: null })
    } catch (error) {
      if (error instanceof ApiError && error.status >= 400) {
        set({ loading: false, error: error.message })
        return
      }
      // Offline fallback: create the local demo account.
      const user: User = {
        id: uid('usr'),
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        email: payload.email.toLowerCase(),
        role: 'NATIVE',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        avatar: avatar ?? undefined,
      }
      saveJSON(USER_KEY, user)
      set({ user, loading: false, error: null })
    }
  },

  verifyEmail: async (otp) => {
    set({ loading: true, error: null })
    const pending = loadPendingRegistration()
    const user = get().user
    const email = pending?.email ?? user?.email

    if (!email) {
      set({ loading: false, error: 'No pending registration found — sign up again.' })
      return
    }
    if (!otp || otp.trim().length < 4) {
      set({ loading: false, error: 'Enter the verification code from your inbox.' })
      return
    }

    try {
      const response = await verifyEmailAndLogin(email, otp.trim())
      saveTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userId: response.userId,
      })

      const verified: User = {
        ...(user ?? {
          id: response.userId,
          name: pending ? `${pending.firstName} ${pending.lastName}`.trim() : nameForEmail(email),
          email: email.toLowerCase(),
          role: roleFromBackend(response.role),
          createdAt: new Date().toISOString(),
        }),
        id: response.userId,
        role: roleFromBackend(response.role),
        emailVerified: true,
      }
      saveJSON(USER_KEY, verified)
      localStorage.removeItem(PENDING_KEY)
      set({ user: verified, loading: false, error: null })

      // Push the caricature to the backend in the background (Cloudinary).
      const avatar = pending?.avatar
      if (avatar) {
        void uploadCaricature(response.userId, avatar).catch(() => undefined)
      }
    } catch (error) {
      if (error instanceof ApiError && error.status >= 400) {
        set({ loading: false, error: error.message })
        return
      }
      // Offline fallback: verify locally.
      get().verifyEmailLocal()
      set({ loading: false, error: null })
    }
  },

  resendVerification: async () => {
    const pending = loadPendingRegistration()
    const email = pending?.email ?? get().user?.email
    if (!email) throw new Error('No pending registration found.')
    await resendVerification(email)
  },

  verifyEmailLocal: () => {
    const user = get().user
    if (!user) return
    const next = { ...user, emailVerified: true }
    saveJSON(USER_KEY, next)
    localStorage.removeItem(PENDING_KEY)
    set({ user: next })
  },

  updateProfile: (patch) => {
    const user = get().user
    if (!user) return
    const next = { ...user, ...patch }
    saveJSON(USER_KEY, next)
    set({ user: next })
  },

  logout: async () => {
    const hadTokens = Boolean(loadTokens())
    await logoutUser()
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PENDING_KEY)
    saveTokens(null)
    set({ user: null, error: null })
    void hadTokens
  },

  clearError: () => set({ error: null }),
}))
