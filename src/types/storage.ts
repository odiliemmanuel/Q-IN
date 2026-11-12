/**
 * Storage Types
 */

export interface StoredUser {
  id: string
  name: string
  email: string
  role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'
  emailVerified: boolean
  exp?: number
  iat?: number
}

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  exp: number
  iat: number
}

export interface QueueStorage {
  activeQueueId: string | null
  lastPositionUpdate: number
}

export const STORAGE_KEYS = {
  USER: 'q-in:user',
  TOKENS: 'q-in:tokens',
  ACTIVE_QUEUE: 'q-in:active_queue',
} as const