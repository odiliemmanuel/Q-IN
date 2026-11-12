import create from 'zustand';
export const useUIStore = create((set) => ({
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    theme: 'light',
    setTheme: (mode) => set({ theme: mode }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
