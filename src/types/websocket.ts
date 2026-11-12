/**
 * WebSocket Types
 */

export interface WebSocketConnectionState {
  connected: boolean
  connecting: boolean
  lastError?: string
  retryCount: number
}

export interface WebSocketConfig {
  url: string
  heartbeatInterval: number
  maxReconnectAttempts: number
  initialBackoff: number
}

export interface StompSubscription {
  id: string
  destination: string
  unsubscribe: () => void
}

/**
 * Storage Types
 */

export interface StorageConfig {
  accessTokenKey: string
  refreshTokenKey: string
  userKey: string
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'q-in:access_token',
  REFRESH_TOKEN: 'q-in:refresh_token',
  USER: 'q-in:user',
} as const

/**
 * API Client Configuration
 */

export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  withCredentials: boolean
}

/**
 * Notification Types
 */

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  relatedId?: string
  relatedType?: 'queue' | 'cohort' | 'admin'
  read: boolean
  createdAt: string
}

export interface NotificationMarker {
  id: string
  markRead: boolean
}

export interface NotificationPage {
  notifications: Notification[]
  hasMore: boolean
  page: number
  total: number
}