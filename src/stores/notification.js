import create from 'zustand';
const useNotificationStore = create((set) => ({
    notifications: [],
    hasMore: true,
    page: 1,
    isLoading: false,
    error: null,
    loadNotifications: async (page) => {
        const pageNum = page || get().page;
        set({ isLoading: true, error: null });
        try {
            const data = await authApi.getNotifications(pageNum);
            set((state) => ({
                notifications: pageNum === 1
                    ? data.data?.notifications || []
                    : [...state.notifications, ...(data.data?.notifications || [])],
                hasMore: data.data?.hasMore || false,
                page: data.data?.page || state.page,
            }));
        }
        catch (error) {
            set({ error: error.response?.data?.message || 'Failed to load notifications' });
        }
        finally {
            set({ isLoading: false });
        }
    },
    markRead: async (notificationId) => {
        try {
            await authApi.markRead(notificationId);
            set((state) => ({
                notifications: state.notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n),
            }));
        }
        catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    },
    markAllRead: async () => {
        try {
            await authApi.markAllRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
            }));
        }
        catch (error) {
            console.error('Failed to mark all readings:', error);
        }
    },
    deleteNotification: async (notificationId) => {
        try {
            await authApi.deleteNotification(notificationId);
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== notificationId),
            }));
        }
        catch (error) {
            console.error('Failed to delete notification:', error);
        }
    },
}));
export default useNotificationStore;
