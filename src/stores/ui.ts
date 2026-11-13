import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface UiState {
  theme: Theme
  sidebarOpen: boolean
  toast: Toast | null
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  notify: (message: string, tone?: ToastTone) => void
  dismissToast: () => void
}

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem('qin:theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  try {
    localStorage.setItem('qin:theme', theme)
  } catch {
    /* ignore */
  }
}

const startTheme = initialTheme()
applyTheme(startTheme)

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useUiStore = create<UiState>((set, get) => ({
  theme: startTheme,
  sidebarOpen: false,
  toast: null,

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  notify: (message, tone = 'success') => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: { id: Date.now(), message, tone } })
    toastTimer = setTimeout(() => set({ toast: null }), 3800)
  },

  dismissToast: () => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: null })
  },
}))
