/**
 * API Response Types
 */

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ErrorResponse {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

/**
 * Authentication Types
 */

export interface User {
  id: string
  name: string
  email: string
  role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'
  emailVerified: boolean
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  cohortId?: string
}

export interface VerifyEmailData {
  code: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
}

/**
 * Queue Types
 */

export interface Cohort {
  id: string
  name: string
  description?: string
  createdAt: string
}

export interface Queue {
  id: string
  name: string
  cohortId: string
  capacity: number
  currentOccupancy: number
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE'
  position?: number
  waitTime?: number
  createdAt: string
}

export interface QueueEntry {
  id: string
  userId: string
  queueId: string
  position: number
  joinedAt: string
  leftAt?: string
  status: 'WAITING' | 'IN_QUEUE' | 'SERVED' | 'LEFT'
}

export interface QueuePositionUpdate {
  queueId: string
  position: number
  waitTime: number
  status: 'WAITING' | 'IN_QUEUE' | 'SERVED'
}

export interface QueueMetrics {
  totalEntries: number
  activeEntries: number
  averageWaitTime: number
  servedToday: number
}

/**
 * WebSocket Types
 */

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export interface QueuePositionEvent {
  type: 'queue:positionUpdate'
  data: QueuePositionUpdate
}

export interface QueueStatusEvent {
  type: 'queue:statusChange'
  data: {
    queueId: string
    status: 'OPEN' | 'CLOSED'
    occupancy: number
  }
}

export interface NotificationEvent {
  type: 'notification:new'
  data: {
    id: string
    userId: string
    title: string
    message: string
    relatedId?: string
    relatedType?: 'queue' | 'cohort' | 'admin'
    read: boolean
    createdAt: string
  }
}

/**
 * Store Types
 */

export interface AuthStore {
  user: User | null
  tokens: AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
  role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'
  setUser: (user: User | null) => void
  setTokens: (tokens: AuthTokens | null) => void
  setLoading: (isLoading: boolean) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setRole: (role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN') => void
  logout: () => void
}

export interface UiStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setSidebarOpen: (open: boolean) => void
  setTheme: (mode: 'light' | 'dark') => void
  toggleSidebar: () => void
}

export interface QueueStore {
  activeQueue: Queue | null
  position: number | null
  waitTime: number | null
  status: 'WAITING' | 'IN_QUEUE' | 'SERVED' | 'LEFT'
  setActiveQueue: (queue: Queue | null) => void
  setPosition: (position: number | null) => void
  setWaitTime: (waitTime: number | null) => void
  setStatus: (status: 'WAITING' | 'IN_QUEUE' | 'SERVED' | 'LEFT') => void
  joinQueue: (queueId: string) => Promise<void>
  leaveQueue: () => Promise<void>
}

/**
 * Router Types
 */

export interface RouteRecord {
  path: string
  element: React.ReactNode
  title: string
  authRequired?: boolean
  allowedRoles?: ('NATIVE' | 'ADMIN' | 'SUPER_ADMIN')[]
}

export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  DASHBOARD: {
    ROOT: '/dashboard',
    COHORTS: '/dashboard/cohorts',
    QUEUES: '/dashboard/cohorts/queues',
    QUEUE_DETAIL: '/dashboard/cohorts/queues/:queueId',
    ADMIN_DASHBOARD: '/dashboard/admin',
    SUPER_ADMIN_DASHBOARD: '/dashboard/super-admin',
  },
}

/**
 * WebSocket Topic Patterns
 */

export const WS_TOPICS = {
  USER_QUEUE: (userId: string) => `/user/${userId}/queue`,
  QUEUE_DETAIL: (queueId: string) => `/queue/${queueId}`,
  ALL_QUEUES: '/queue',
} as const