import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface CreateQueueRequest {
  maxCapacity: number
  name?: string
  recurring?: boolean
}

export interface QueueStats {
  currentOccupancy: number
  availableSpace: number
  maxCapacity: number
}

export interface QueueUser {
  queueId?: string
  username: string
  role?: string
  gender?: string
  cohort?: string
  whatsAppNumber?: string
  numberInQueue: number
  profilePictureUrl?: string | null
  checkedIn?: boolean
  message?: string
}

export interface Queue {
  id: string
  name: string
  recurring?: boolean
  queueDate?: string | null
  isOpen: boolean
  isFull: boolean
  maxCapacity: number
  createdAt?: string
  createdDate?: string
}

export const queuesApi = {
  async createQueue(data: CreateQueueRequest): Promise<Queue> {
    return api.post<Queue>(API_ENDPOINTS.queues.create, data)
  },

  async getAllQueues(): Promise<{ queues: Queue[]; numberOfQueues: number | null }> {
    return api.get<{ queues: Queue[]; numberOfQueues: number | null }>(API_ENDPOINTS.queues.all)
  },

  async getQueueUsers(queueId: string): Promise<QueueUser[]> {
    return api.get<QueueUser[]>(API_ENDPOINTS.queues.getUsers(queueId))
  },

  async getQueueStats(queueId: string): Promise<QueueStats> {
    return api.get<QueueStats>(API_ENDPOINTS.queues.getStats(queueId))
  },

  async enterQueue(userId: string, code: string, queueId?: string): Promise<void> {
    const params = new URLSearchParams({ code })
    if (queueId) params.set('queueId', queueId)
    return api.post<void>(`${API_ENDPOINTS.queues.enter(userId)}?${params.toString()}`)
  },

  async exitQueue(userId: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.queues.exit(userId))
  },

  async closeQueue(queueId: string): Promise<void> {
    return api.post<void>(API_ENDPOINTS.queues.close(queueId))
  },

  async updateCapacity(capacity: number): Promise<void> {
    return api.put<void>(API_ENDPOINTS.queues.updateCapacity(capacity))
  },

  async deleteQueue(queueId: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.queues.delete(queueId))
  },
}