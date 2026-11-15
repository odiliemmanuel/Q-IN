import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'QUEUE_JOINED' | 'QUEUE_LEFT' | 'QUEUE_CALLED' | 'QUEUE_UPDATED' | 'SYSTEM' | string
  read: boolean
  relatedEntityId?: string
  relatedEntityType?: string
  createdAt: string
  readAt?: string
}

export interface NotificationsResponse {
  totalPages: number
  totalElements: number
  size: number
  content: Notification[]
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  pageable: {
    offset: number
    paged: boolean
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    unpaged: boolean
  }
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export const notificationsApi = {
  async getNotifications(page = 0, size = 20): Promise<NotificationsResponse> {
    const query = new URLSearchParams({ page: page.toString(), size: size.toString() }).toString()
    return api.get<NotificationsResponse>(`${API_ENDPOINTS.notifications.list}?${query}`)
  },

  async getUnreadNotifications(): Promise<Notification[]> {
    return api.get<Notification[]>(API_ENDPOINTS.notifications.unread)
  },

  async getUnreadCount(): Promise<number> {
    return api.get<number>(API_ENDPOINTS.notifications.unreadCount)
  },

  async markAsRead(notificationId: string): Promise<void> {
    return api.patch<void>(API_ENDPOINTS.notifications.markRead(notificationId))
  },

  async markAllAsRead(): Promise<void> {
    return api.patch<void>(API_ENDPOINTS.notifications.markAllRead)
  },
}