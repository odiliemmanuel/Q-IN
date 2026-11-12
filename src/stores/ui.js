import create from 'zustand';
const useUiStore = create((set) => ({
    sidebarOpen: true,
    theme: 'light',
    notificationCount: 0,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setTheme: (mode) => set({ theme: mode }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    incrementNotificationCount: (count = 1) => set((state) => ({ notificationCount: state.notificationCount + count })),
    resetNotificationCount: () => set({ notificationCount: 0 }),
}));
export default useUiStore;
