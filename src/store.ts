import create from 'zustand'

export type ThemeMode = 'light' | 'dark'

export interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  theme: 'light',
  setTheme: (mode: ThemeMode) => set({ theme: mode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))