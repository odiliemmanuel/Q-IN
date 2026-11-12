import create from 'zustand'

export interface UiState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notificationCount: number
  setSidebarOpen: (open: boolean) => void
  setTheme: (mode: 'light' | 'dark') => void
  toggleSidebar: () => void
  incrementNotificationCount: (count?: number) => void
  resetNotificationCount: () => void
}

const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  notificationCount: 0,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setTheme: (mode: 'light' | 'dark') => set({ theme: mode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  incrementNotificationCount: (count = 1) =>
    set((state) => ({ notificationCount: state.notificationCount + count })),
  resetNotificationCount: () => set({ notificationCount: 0 }),
}))

export default useUiStore