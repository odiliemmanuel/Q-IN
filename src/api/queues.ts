import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface CreateQueueRequest {
  queueId: string
  maxCapacity: number
}

export interface QueueStats {
  currentOccupancy: number
  availableSpace: number
  maxCapacity: number
}

export interface QueueUser {
  id: string
  name: string
  position: number
  joinedAt: string
  caricatureUrl?: string
}

export interface Queue {
  id: string
  name: string
  maxCapacity: number
  currentSize: number
  isActive: boolean
  createdAt: string
}

export const queuesApi = {
  async createQueue(data: CreateQueueRequest): Promise<void> {
    return api.post<void>(API_ENDPOINTS.queues.create, data)
  },

  async getAllQueues(): Promise<Queue[]> {
    return api.get<Queue[]>(API_ENDPOINTS.queues.all)
  },

  async getQueueUsers(queueId: string): Promise<QueueUser[]> {
    return api.get<QueueUser[]>(API_ENDPOINTS.queues.getUsers(queueId))
  },

  async getQueueStats(queueId: string): Promise<QueueStats> {
    return api.get<QueueStats>(API_ENDPOINTS.queues.getStats(queueId))
  },

  async enterQueue(userId: string, code: string): Promise<void> {
    const query = new URLSearchParams({ code }).toString()
    return api.post<void>(`${API_ENDPOINTS.queues.enter(userId)}?${query}`)
  },

  async exitQueue(userId: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.queues.exit(userId))
  },

  async updateCapacity(capacity: number): Promise<void> {
    return api.put<void>(API_ENDPOINTS.queues.updateCapacity(capacity))
  },

  async deleteQueue(queueId: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.queues.delete(queueId))
  },
}