import create from 'zustand';
const useQueueStore = create((set) => ({
    activeQueue: null,
    position: null,
    waitTime: null,
    status: 'WAITING',
    metrics: null,
    isLoading: false,
    setActiveQueue: (queue) => set({ activeQueue: queue }),
    setPosition: (position) => set({ position }),
    setWaitTime: (waitTime) => set({ waitTime }),
    setStatus: (status) => set({ status }),
    setMetrics: (metrics) => set({ metrics }),
    setLoading: (isLoading) => set({ isLoading }),
    joinQueue: async (queueId) => {
        set({ isLoading: true });
        try {
            const data = await apiQueue.joinQueue(queueId);
            setActiveQueue(data.queue || data);
            setPosition(data.position || null);
            setWaitTime(data.waitTime || null);
            setStatus(data.status || 'WAITING');
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to join queue');
        }
        finally {
            set({ isLoading: false });
        }
    },
    leaveQueue: async () => {
        set({ isLoading: true });
        try {
            await apiQueue.leaveQueue();
            setActiveQueue(null);
            setPosition(null);
            setWaitTime(null);
            setStatus('LEFT');
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to leave queue');
        }
        finally {
            set({ isLoading: false });
        }
    },
    refreshPosition: async (queueId) => {
        set({ isLoading: true });
        try {
            const data = await apiQueue.getQueuePosition(queueId);
            setPosition(data.position || null);
            setWaitTime(data.waitTime || null);
            setStatus(data.status || 'WAITING');
        }
        catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to refresh position');
        }
        finally {
            set({ isLoading: false });
        }
    },
}));
export default useQueueStore;
