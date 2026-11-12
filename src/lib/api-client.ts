import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type {
  ApiResponse,
  ErrorResponse,
  AuthTokens,
  User,
  LoginCredentials,
  RegisterData,
  VerifyEmailData,
  ForgotPasswordData,
  ResetPasswordData,
  StoredTokens,
  StoredUser,
} from '../types/api'
import type { StoredUser as StoredUserType } from '../types/storage'

// API base URL from environment
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000/ws'

// Axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
})

/**
 * Interceptors
 */

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const storedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS)
    if (storedTokens) {
      try {
        const tokens: StoredTokens = JSON.parse(storedTokens)
        // Check if token is expired
        const now = Date.now() / 1000
        if (tokens.exp > now) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
        } else {
          // Token expired, try to refresh
          await refreshAuthTokens(config)
        }
      } catch (error) {
        console.error('Failed to parse stored tokens', error)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle auth errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await refreshAuthTokens(originalRequest)
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        logoutUser()
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Refresh auth tokens using refresh token
 */

async function refreshAuthTokens(originalRequest?: AxiosRequestConfig): Promise<void> {
  const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.TOKENS)
  if (!storedRefreshToken) {
    logoutUser()
    return Promise.reject(new Error('No refresh token available'))
  }

  try {
    const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/refresh-token', {
      refreshToken: storedRefreshToken,
    })

    if (data.success && data.data) {
      const { accessToken, refreshToken, expiresIn } = data.data
      const exp = Date.now() / 1000 + expiresIn * 1000

      const storedTokens: StoredTokens = {
        accessToken,
        refreshToken,
        exp,
        iat: Date.now() / 1000,
      }

      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(storedTokens))

      // Update the original request header if provided
      if (originalRequest) {
        originalRequest.headers!.Authorization = `Bearer ${accessToken}`
      }
    } else {
      logoutUser()
    }
  } catch (error) {
    logoutUser()
    throw error
  }
}

/**
 * Logout user and clear all state
 */

function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKENS)
  localStorage.removeItem(STORAGE_KEYS.USER)
  // Dispatch a global event so stores can update
  window.dispatchEvent(new Event('q-in:logout'))
}

/**
 * Auth utilities
 */

export const getStoredUser = (): StoredUser | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export const setStoredUser = (user: StoredUser): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

export const clearStoredUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER)
}

/**
 * API methods
 */

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthTokens>>('/auth/login', credentials).then((res) => res.data),

  register: (data: RegisterData) =>
    api.post<ApiResponse<AuthTokens>>('/auth/register', data).then((res) => res.data),

  verifyEmail: (code: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/verify-email', { code }).then((res) => res.data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<void>>('/auth/forgot-password', { email }).then((res) => res.data),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<void>>('/auth/reset-password', { token, password }).then((res) => res.data),
}

export const userApi = {
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    api.get<ApiResponse<User>>('/auth/me').then((res) => res.data),

  resendVerification: () =>
    api.post<ApiResponse<void>>('/auth/resend-verification').then((res) => res.data),
}

export const queueApi = {
  getCohorts: (): Promise<ApiResponse<Cohort[]>> =>
    api.get<ApiResponse<Cohort[]>>('/cohorts').then((res) => res.data),

  createCohort: (name: string, description?: string) =>
    api.post<ApiResponse<Cohort>>('/cohorts', { name, description }).then((res) => res.data),

  getQueues: (cohortId?: string) =>
    api.get<ApiResponse<Queue[]>>('/queues' + (cohortId ? `?cohortId=${cohortId}` : '')).then(
      (res) => res.data
    ),

  createQueue: (name: string, cohortId: string, capacity: number) =>
    api.post<ApiResponse<Queue>>('/queues', { name, cohortId, capacity }).then((res) => res.data),

  getQueueDetail: (queueId: string) =>
    api.get<ApiResponse<Queue>>(`/queues/${queueId}`).then((res) => res.data),

  joinQueue: (queueId: string) =>
    api.post<ApiResponse<QueuePositionUpdate>>(`/queues/${queueId}/join`).then((res) => res.data),

  leaveQueue: () => api.post<ApiResponse<void>>('/queues/leave').then((res) => res.data),

  getQueuePosition: (queueId: string) =>
    api.get<ApiResponse<QueuePositionUpdate>>(`/queues/${queueId}/position`).then((res) => res.data),

  toggleQueue: (queueId: string, open: boolean) =>
    api.post<ApiResponse<Queue>>(`/queues/${queueId}/toggle`, { open }).then((res) => res.data),
}

export const notificationApi = {
  getNotifications: (page: number = 1, limit: number = 20) =>
    api.get<ApiResponse<NotificationPage>>(`/notifications?page=${page}&limit=${limit}`).then(
      (res) => res.data
    ),

  markRead: (notificationId: string) =>
    api.post<ApiResponse<void>>(`/notifications/${notificationId}/read`).then((res) => res.data),

  markAllRead: () =>
    api.post<ApiResponse<void>>('/notifications/mark-all-read').then((res) => res.data),

  deleteNotification: (notificationId: string) =>
    api.delete<ApiResponse<void>>(`/notifications/${notificationId}`).then((res) => res.data),
}

export const adminApi = {
  getMetrics: (): Promise<ApiResponse> => api.get<ApiResponse>('/admin/metrics').then((res) => res.data),

  getQueues: (): Promise<ApiResponse<Queue[]>> => api.get<ApiResponse<Queue[]>>('/admin/queues').then((res) => res.data),

  createAdmin: (email: string, role: 'ADMIN' | 'SUPER_ADMIN') =>
    api.post<ApiResponse>('/admin/create-admin', { email, role }).then((res) => res.data),

  getAdmins: (): Promise<ApiResponse> => api.get<ApiResponse>('/admin/list').then((res) => res.data),

  promoteUser: (userId: string) =>
    api.post<ApiResponse>('/admin/promote', { userId }).then((res) => res.data),

  suspendAdmin: (adminId: string) =>
    api.post<ApiResponse>('/admin/suspend', { adminId }).then((res) => res.data),

  reactivateAdmin: (adminId: string) =>
    api.post<ApiResponse>('/admin/reactivate', { adminId }).then((res) => res.data),

  deleteAdmin: (adminId: string) =>
    api.delete<ApiResponse>(`/admin/${adminId}`).then((res) => res.data),

  getWebhooks: (): Promise<ApiResponse> => api.get<ApiResponse>('/admin/webhooks').then((res) => res.data),

  createWebhook: (endpoint: string, events: string[]) =>
    api.post<ApiResponse>('/admin/webhooks', { endpoint, events }).then((res) => res.data),

  getWebhookHistory: (): Promise<ApiResponse> => api.get<ApiResponse>('/admin/webhook-history').then((res) => res.data),

  testWebhook: (webhookId: string) =>
    api.post<ApiResponse>(`/admin/webhooks/${webhookId}/test`).then((res) => res.data),
}

export const routerApi = {
  getRouteRecords: (): Promise<ApiResponse<RouteRecord[]>> =>
    api.get<ApiResponse<RouteRecord[]>>('/routes').then((res) => res.data),

  getAllowedPaths: (role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'): Promise<ApiResponse<string[]>> =>
    api.get<ApiResponse<string[]>>(`/routes/allowed?role=${role}`).then((res) => res.data),
}

/**
 * Export types for external use
 */
export type { ApiResponse, ErrorResponse, User, AuthTokens, LoginCredentials, RegisterData }

export { BASE_URL, WS_URL }