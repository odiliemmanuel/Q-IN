import create from 'zustand'
import type { Queue, QueuePositionUpdate, QueueMetrics } from '../types/api'

export interface QueueState {
  activeQueue: Queue | null
  position: number | null
  waitTime: number | null
  status: 'WAITING' | 'IN_QUEUE' | 'SERVED' | 'LEFT'
  metrics: QueueMetrics | null
  isLoading: boolean
  setActiveQueue: (queue: Queue | null) => void
  setPosition: (position: number | null) => void
  setWaitTime: (waitTime: number | null) => void
  setStatus: (status: 'WAITING' | 'IN_QUEUE' | 'SERVED' | 'LEFT') => void
  setMetrics: (metrics: QueueMetrics | null) => void
  setLoading: (isLoading: boolean) => void
  joinQueue: (queueId: string) => Promise<void>
  leaveQueue: () => Promise<void>
  refreshPosition: (queueId: string) => Promise<void>
}

const useQueueStore = create<QueueState>((set) => ({
  activeQueue: null,
  position: null,
  waitTime: null,
  status: 'WAITING',
  metrics: null,
  isLoading: false,

  setActiveQueue: (queue: Queue | null) => set({ activeQueue: queue }),

  setPosition: (position: number | null) => set({ position }),

  setWaitTime: (waitTime: number | null) => set({ waitTime }),

  setStatus: (status: 'WAITING' | 'IN_QUEUE' | 'SERVED' | 'LEFT') => set({ status }),

  setMetrics: (metrics: QueueMetrics | null) => set({ metrics }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  joinQueue: async (queueId: string) => {
    set({ isLoading: true })
    try {
      const data = await apiQueue.joinQueue(queueId)
      setActiveQueue(data.queue || data)
      setPosition(data.position || null)
      setWaitTime(data.waitTime || null)
      setStatus(data.status || 'WAITING')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join queue')
    } finally {
      set({ isLoading: false })
    }
  },

  leaveQueue: async () => {
    set({ isLoading: true })
    try {
      await apiQueue.leaveQueue()
      setActiveQueue(null)
      setPosition(null)
      setWaitTime(null)
      setStatus('LEFT')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to leave queue')
    } finally {
      set({ isLoading: false })
    }
  },

  refreshPosition: async (queueId: string) => {
    set({ isLoading: true })
    try {
      const data = await apiQueue.getQueuePosition(queueId)
      setPosition(data.position || null)
      setWaitTime(data.waitTime || null)
      setStatus(data.status || 'WAITING')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to refresh position')
    } finally {
      set({ isLoading: false })
    }
  },
}))

export default useQueueStore