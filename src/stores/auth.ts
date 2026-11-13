import { create } from 'zustand'
import type { Role, User } from '../lib/types'
import { loadJSON, saveJSON } from '../lib/persist'
import { uid } from '../lib/utils'

const USER_KEY = 'qin:user'

export const DEMO_ACCOUNTS: Array<{ role: Role; email: string; name: string; label: string }> = [
  { role: 'NATIVE', email: 'member@qin.app', name: 'Ada Okafor', label: 'Member' },
  { role: 'ADMIN', email: 'admin@qin.app', name: 'Tunde Bello', label: 'Admin' },
  { role: 'SUPER_ADMIN', email: 'super@qin.app', name: 'Zainab Musa', label: 'Super admin' },
]

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

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginDemo: (role: Role) => void
  verifyEmail: () => void
  updateProfile: (patch: Partial<Pick<User, 'name'>>) => void
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadJSON<User | null>(USER_KEY, null),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    await sleep(550)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      set({ loading: false, error: 'Enter a valid email address.' })
      return
    }
    if (password.length < 6) {
      set({ loading: false, error: 'Password must be at least 6 characters.' })
      return
    }

    const demo = DEMO_ACCOUNTS.find((account) => account.email === email.toLowerCase())
    const user: User = {
      id: demo ? `demo_${demo.role.toLowerCase()}` : uid('usr'),
      name: demo?.name ?? nameForEmail(email),
      email: email.toLowerCase(),
      role: demo?.role ?? roleForEmail(email),
      emailVerified: true,
      createdAt: new Date().toISOString(),
    }

    saveJSON(USER_KEY, user)
    set({ user, loading: false, error: null })
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null })
    await sleep(650)

    if (name.trim().length < 2) {
      set({ loading: false, error: 'Please enter your full name.' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      set({ loading: false, error: 'Enter a valid email address.' })
      return
    }
    if (password.length < 6) {
      set({ loading: false, error: 'Password must be at least 6 characters.' })
      return
    }

    const user: User = {
      id: uid('usr'),
      name: name.trim(),
      email: email.toLowerCase(),
      role: 'NATIVE',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    }

    saveJSON(USER_KEY, user)
    set({ user, loading: false, error: null })
  },

  loginDemo: (role) => {
    const account = DEMO_ACCOUNTS.find((item) => item.role === role) ?? DEMO_ACCOUNTS[0]
    const user: User = {
      id: `demo_${role.toLowerCase()}`,
      name: account.name,
      email: account.email,
      role,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    }
    saveJSON(USER_KEY, user)
    set({ user, error: null })
  },

  verifyEmail: () => {
    const user = get().user
    if (!user) return
    const next = { ...user, emailVerified: true }
    saveJSON(USER_KEY, next)
    set({ user: next })
  },

  updateProfile: (patch) => {
    const user = get().user
    if (!user) return
    const next = { ...user, ...patch }
    saveJSON(USER_KEY, next)
    set({ user: next })
  },

  logout: () => {
    localStorage.removeItem(USER_KEY)
    set({ user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
