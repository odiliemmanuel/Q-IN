import create from 'zustand'
import { type User } from '../types/api'

/**
 * Auth Store - Zustand store for authentication state
 */

export interface AuthState {
  user: User | null
  tokens: any | null // AuthTokens
  isLoading: boolean
  isAuthenticated: boolean
  role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'
  redirectTo: string | null
  setUser: (user: User | null) => void
  setTokens: (tokens: any | null) => void
  setLoading: (isLoading: boolean) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setRole: (role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN') => void
  setRedirectTo: (path: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, cohortId?: string) => Promise<void>
  verifyEmail: (code: string) => Promise<void>
  logout: () => void
  refreshTokens: () => Promise<void>
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser() || null,
  tokens: JSON.parse(localStorage.getItem('q-in:tokens') || 'null'),
  isLoading: false,
  isAuthenticated: !!getStoredUser(),
  role: 'NATIVE', // default role
  redirectTo: null,

  setUser: (user: User | null) => {
    set({ user })
    if (user) {
      setStoredUser(user)
    } else {
      clearStoredUser()
    }
  },

  setTokens: (tokens: any | null) => {
    set({ tokens })
    if (tokens) {
      localStorage.setItem('q-in:tokens', JSON.stringify(tokens))
    } else {
      localStorage.removeItem('q-in:tokens')
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),

  setRole: (role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN') => set({ role }),

  setRedirectTo: (path: string | null) => set({ redirectTo: path }),

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const data = await authApi.login({ email, password })
      setTokens(data.tokens || data)
      // Set user from tokens data
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

      // Set redirect based on role
      const role = get().role
      let redirectPath = '/dashboard/cohorts/queues' // default

      if (role === 'SUPER_ADMIN') {
        redirectPath = '/dashboard/super-admin'
      } else if (role === 'ADMIN') {
        redirectPath = '/dashboard/admin'
      } else if (role === 'NATIVE') {
        redirectPath = '/dashboard/cohorts/queues'
      }

      setRedirectTo(redirectPath)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (name: string, email: string, password: string, cohortId?: string) => {
    set({ isLoading: true })
    try {
      const data = await authApi.register({ name, email, password, cohortId })
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

      const role = get().role
      let redirectPath = '/dashboard/cohorts/queues'

      if (role === 'SUPER_ADMIN') {
        redirectPath = '/dashboard/super-admin'
      } else if (role === 'ADMIN') {
        redirectPath = '/dashboard/admin'
      } else if (role === 'NATIVE') {
        redirectPath = '/dashboard/cohorts/queues'
      }

      setRedirectTo(redirectPath)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    } finally {
      set({ isLoading: false })
    }
  },

  verifyEmail: async (code: string) => {
    set({ isLoading: true })
    try {
      const data = await authApi.verifyEmail({ code })
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

      const role = get().role
      let redirectPath = '/dashboard/cohorts/queues'

      if (role === 'SUPER_ADMIN') {
        redirectPath = '/dashboard/super-admin'
      } else if (role === 'ADMIN') {
        redirectPath = '/dashboard/admin'
      } else if (role === 'NATIVE') {
        redirectPath = '/dashboard/cohorts/queues'
      }

      setRedirectTo(redirectPath)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed')
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    disconnectWebSocket()
    setTokens(null)
    setUser(null)
    setRole('NATIVE')
    setAuthenticated(false)
    setRedirectTo(null)
    localStorage.removeItem('q-in:tokens')
    localStorage.removeItem('q-in:user')
    window.dispatchEvent(new Event('q-in:logout'))
  },

  refreshTokens: async () => {
    set({ isLoading: true })
    try {
      const data = await authApi.refreshToken()
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
    } catch (error) {
      logout()
    } finally {
      set({ isLoading: false })
    }
  },
}))

export default useAuthStore