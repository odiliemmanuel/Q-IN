import { create } from 'zustand'
import type { Role, User } from '../lib/types'
import { loadJSON, saveJSON } from '../lib/persist'
import { authApi, type LoginResponse, type RegisterResponse } from '../api'

const USER_KEY = 'qin:user'

function mapLoginResponseToUser(response: LoginResponse): User {
  return {
    id: response.userId,
    name: '',
    email: '',
    role: response.role as Role,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  }
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
  login: (userIdentifier: string, pin: string, isAdmin?: boolean, isSuperAdmin?: boolean) => Promise<void>
  register: (data: {
    firstName: string
    lastName: string
    userName: string
    pin: string
    email: string
    phoneNumber: string
    whatsappNumber: string
    gender: 'MALE' | 'FEMALE'
    cohortId: string
  }) => Promise<void>
  verifyEmail: (email: string, otp: string) => Promise<void>
  verifyEmailAndLogin: (email: string, otp: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  refreshToken: () => Promise<void>
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>
  updateProfile: (patch: Partial<Pick<User, 'name'>>) => void
  logout: () => Promise<void>
  clearError: () => void
  fetchUserProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadJSON<User | null>(USER_KEY, null),
  loading: false,
  error: null,

  login: async (userIdentifier, pin, isAdmin = false, isSuperAdmin = false) => {
    set({ loading: true, error: null })

    try {
      let response: LoginResponse
      if (isSuperAdmin) {
        response = await authApi.superAdminLogin({ userIdentifier, pin })
      } else if (isAdmin) {
        response = await authApi.adminLogin({ userIdentifier, pin })
      } else {
        response = await authApi.login({ userIdentifier, pin })
      }

      const user = mapLoginResponseToUser(response)
      saveJSON(USER_KEY, user)
      set({ user, loading: false, error: null })

      await get().fetchUserProfile()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.'
      set({ loading: false, error: message })
      throw error
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })

    try {
      const response: RegisterResponse = await authApi.register(data)
      const user: User = {
        id: response.userId,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        role: 'NATIVE',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      }
      saveJSON(USER_KEY, user)
      set({ user, loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      set({ loading: false, error: message })
      throw error
    }
  },

  verifyEmail: async (email, otp) => {
    set({ loading: true, error: null })
    try {
      await authApi.verifyEmail({ email, otp })
      const user = get().user
      if (user) {
        const next = { ...user, emailVerified: true }
        saveJSON(USER_KEY, next)
        set({ user: next, loading: false, error: null })
      } else {
        set({ loading: false, error: null })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email verification failed.'
      set({ loading: false, error: message })
      throw error
    }
  },

  verifyEmailAndLogin: async (email, otp) => {
    set({ loading: true, error: null })
    try {
      const response = await authApi.verifyEmailAndLogin({ email, otp })
      const user = mapLoginResponseToUser(response)
      saveJSON(USER_KEY, user)
      set({ user, loading: false, error: null })
      await get().fetchUserProfile()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email verification failed.'
      set({ loading: false, error: message })
      throw error
    }
  },

  resendVerification: async (email) => {
    set({ loading: true, error: null })
    try {
      await authApi.resendVerification(email)
      set({ loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification.'
      set({ loading: false, error: message })
      throw error
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      await authApi.forgotPassword(email)
      set({ loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email.'
      set({ loading: false, error: message })
      throw error
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ loading: true, error: null })
    try {
      await authApi.resetPassword(token, newPassword)
      set({ loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed.'
      set({ loading: false, error: message })
      throw error
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('qin:refreshToken')
      if (!refreshToken) throw new Error('No refresh token')
      const response = await authApi.refreshToken(refreshToken)
      localStorage.setItem('qin:accessToken', response.accessToken)
      localStorage.setItem('qin:refreshToken', response.refreshToken)
    } catch {
      localStorage.removeItem('qin:accessToken')
      localStorage.removeItem('qin:refreshToken')
      localStorage.removeItem(USER_KEY)
      set({ user: null, error: null })
      throw new Error('Session expired')
    }
  },

  updatePassword: async (oldPassword, newPassword) => {
    set({ loading: true, error: null })
    try {
      await authApi.updatePassword({ oldPassword, newPassword })
      set({ loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password update failed.'
      set({ loading: false, error: message })
      throw error
    }
  },

  updateProfile: (patch) => {
    const user = get().user
    if (!user) return
    const next = { ...user, ...patch }
    saveJSON(USER_KEY, next)
    set({ user: next })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('qin:accessToken')
    localStorage.removeItem('qin:refreshToken')
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PENDING_KEY)
    saveTokens(null)
    set({ user: null, error: null })
    void hadTokens
  },

  fetchUserProfile: async () => {
    // This would fetch the full user profile from an API endpoint
    // For now, we'll use the stored user data
    // TODO: Implement actual profile fetch when API endpoint is available
  },

  clearError: () => set({ error: null }),
}))