/**
 * Queueni backend client.
 *
 * Talks to the deployed Spring Boot API (https://queueni.onrender.com) using
 * JWT bearer tokens. Every response is wrapped in the backend's
 * `{ success, message, data }` envelope, which this module unwraps.
 *
 * The Render free tier sleeps after ~15 minutes of inactivity, so the first
 * request after a quiet period may pay a 30-90s cold start; requests use a
 * generous timeout and callers surface a "waking the backend" hint.
 */

export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

import { tokenStorage } from '../auth/tokenStorage'
import { terminateSession } from '../session/sessionTermination'

const REQUEST_TIMEOUT_MS = 90_000

/** In-flight request dedup cache: key = method + path + params hash. */
const inflight = new Map<string, Promise<unknown>>()

function requestKey(method: string, path: string, params?: Record<string, string | undefined>): string {
  const paramStr = params ? JSON.stringify(params) : ''
  return `${method}:${path}:${paramStr}`
}

export interface Tokens {
  accessToken: string
  refreshToken: string
  userId: string
}

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T | null
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function loadTokens(): Tokens | null {
  const accessToken = tokenStorage.getAccess()
  const refreshToken = tokenStorage.getRefresh()
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken, userId: tokenStorage.getUserId() ?? '' }
}

export function saveTokens(tokens: Tokens | null): void {
  if (!tokens) {
    tokenStorage.clear()
    return
  }
  tokenStorage.set(tokens.accessToken, tokens.refreshToken, tokens.userId)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** JSON body (mutually exclusive with `form`). */
  body?: unknown
  /** URL query params; values are stringified. */
  params?: Record<string, string | undefined>
  /** Attach the bearer token (default true when tokens exist). */
  auth?: boolean
  /** Skip the automatic refresh-token retry. */
  allowRefresh?: boolean
}

async function requestOnce<T>(path: string, options: RequestOptions, token: string | null): Promise<{ data: T; envelope: ApiEnvelope<T> }> {
  const { method = 'GET', body, params, auth = true } = options

  // Build the full URL. When API_BASE is empty (no VITE_API_URL set), fall back
  // to the current origin so relative paths go through the Vite proxy / Vercel
  // rewrite and avoid CORS issues.
  const url = new URL(path, API_BASE || window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timer)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The backend is taking too long to respond — it may be waking up. Try again shortly.', 504)
    }
    throw new ApiError('Could not reach the Queueni backend. Check your connection.', 0)
  }
  clearTimeout(timer)

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    envelope = { success: response.ok, message: response.statusText || 'Request failed', data: null }
  }

  // Handle responses that don't use the standard { success, message, data } envelope
  // (e.g., /api/queue/all returns { queues, message, numberOfQueues } directly).
  if (envelope.success === undefined) {
    envelope.success = response.ok
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(envelope.message || `Request failed (${response.status})`, response.status)
  }

  // If there's no `data` field, the entire response body is the data.
  const data = (envelope.data !== undefined ? envelope.data : envelope) as T
  return { data, envelope }
}

/** Authenticated request with a single automatic refresh-token retry on 401. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const tokens = loadTokens()
  const { method = 'GET', params } = options
  const key = requestKey(method, path, params)

  // Return in-flight promise for identical concurrent requests
  if (inflight.has(key)) {
    return inflight.get(key) as Promise<T>
  }

  const promise = (async () => {
    try {
      const { data } = await requestOnce<T>(path, options, tokens?.accessToken ?? null)
      return data
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)

  try {
    return await promise
  } catch (error) {
    const isUnauthorized = error instanceof ApiError && error.status === 401
    const canRefresh =
      options.allowRefresh !== false &&
      tokens?.refreshToken &&
      isUnauthorized

    if (canRefresh) {
      try {
        const refreshed = await refreshAccessToken(tokens.refreshToken)
        const { data } = await requestOnce<T>(path, options, refreshed.accessToken)
        return data
      } catch (refreshError) {
        // Transient/network errors on refresh must not bounce the user or clear tokens.
        // Only explicit logout clears the session.
        throw refreshError
      }
    }

    // 401 and other errors: throw without clearing tokens or bouncing.
    // Route guards and callers are responsible for redirecting / surfacing messages.
    throw error
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface BackendLoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
  message?: string
  profilePictureUrl?: string | null
}

export interface BackendRegisterResponse {
  userId: string
  message: string
  successFull: boolean
}

export type Gender = 'MALE' | 'FEMALE'

export interface RegisterPayload {
  firstName: string
  lastName: string
  userName?: string | null
  /** Exactly 4 digits. */
  pin: string
  email: string
  phoneNumber?: string | null
  whatsappNumber?: string | null
  gender: Gender
  cohortId: string
}

export async function registerUser(payload: RegisterPayload): Promise<BackendRegisterResponse> {
  return request<BackendRegisterResponse>('/api/v1/users/register', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export async function loginUser(userIdentifier: string, pin: string): Promise<BackendLoginResponse> {
  return request<BackendLoginResponse>('/api/v1/users/login', {
    method: 'POST',
    body: { userIdentifier, pin },
    auth: false,
  })
}

/** Verify an email OTP; returns fresh tokens (logs the user in). */
export async function verifyEmailAndLogin(email: string, otp: string): Promise<BackendLoginResponse> {
  return request<BackendLoginResponse>('/api/v1/users/verify-email', {
    method: 'POST',
    params: { email, otp },
    auth: false,
  })
}

export async function resendVerification(email: string): Promise<string> {
  return request<string>('/api/v1/users/resend-verification', {
    method: 'POST',
    params: { email },
    auth: false,
  })
}

export async function refreshAccessToken(refreshToken: string): Promise<Tokens> {
  const current = loadTokens()
  const data = await request<BackendLoginResponse>('/api/v1/users/refresh-token', {
    method: 'POST',
    params: { refreshToken },
    auth: false,
    allowRefresh: false,
  })
  const nextUserId = current?.userId ?? data.userId
  tokenStorage.set(data.accessToken, data.refreshToken, nextUserId)
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, userId: nextUserId }
}

export async function logoutUser(): Promise<void> {
  await terminateSession()
}

/** Upload a profile picture directly (multipart). Returns the picture URL from backend. */
export async function uploadProfilePicture(userId: string, dataUrl: string): Promise<string> {
  const tokens = loadTokens()
  const blob = await (await fetch(dataUrl)).blob()
  const form = new FormData()
  form.append('file', blob, 'profile.png')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_BASE}/api/v1/users/${userId}/profile-picture`, {
      method: 'POST',
      headers: tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined,
      body: form,
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new ApiError(text || `Profile picture upload failed (${response.status})`, response.status)
    }
    const data = await response.json()
    if (typeof data?.data === 'string') return data.data
    return data?.data?.url ?? data?.data?.profilePictureUrl ?? ''
  } finally {
    clearTimeout(timer)
  }
}

/** Fetch user's profile picture URL from backend. */
export async function fetchProfilePictureUrl(userId: string): Promise<string | null> {
  const tokens = loadTokens()
  if (!tokens) return null
  
  try {
    const response = await fetch(`${API_BASE}/api/v1/users/${userId}/profile-picture`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })
    if (!response.ok) return null
    const data = await response.json()
    if (typeof data?.data === 'string') return data.data
    return data?.data?.url ?? data?.data?.profilePictureUrl ?? null
  } catch {
    return null
  }
}

/** Cache keys for profile picture URLs. */
const PROFILE_PICTURE_CACHE_KEY = 'qin:profile-picture:'
const PROFILE_PICTURE_ETAG_KEY = 'qin:profile-picture:etag:'

/** Get cached profile picture URL for a user. */
export function getCachedProfilePictureUrl(userId: string): string | null {
  try {
    return sessionStorage.getItem(`${PROFILE_PICTURE_CACHE_KEY}${userId}`)
  } catch {
    return null
  }
}

/** Set cached profile picture URL for a user. */
export function setCachedProfilePictureUrl(userId: string, url: string): void {
  try {
    sessionStorage.setItem(`${PROFILE_PICTURE_CACHE_KEY}${userId}`, url)
  } catch {
    // Ignore storage errors
  }
}

/** Get cached ETag for conditional requests. */
export function getCachedProfilePictureETag(userId: string): string | null {
  try {
    return sessionStorage.getItem(`${PROFILE_PICTURE_ETAG_KEY}${userId}`)
  } catch {
    return null
  }
}

/** Set cached ETag. */
export function setCachedProfilePictureETag(userId: string, etag: string): void {
  try {
    sessionStorage.setItem(`${PROFILE_PICTURE_ETAG_KEY}${userId}`, etag)
  } catch {
    // Ignore storage errors
  }
}

/** Poll for profile picture updates (with ETag for efficiency). */
export async function pollProfilePictureUpdates(
  userId: string,
  onUpdate: (url: string) => void,
  intervalMs = 30_000
): Promise<() => void> {
  let stopped = false
  
  const poll = async () => {
    if (stopped) return
    
    const etag = getCachedProfilePictureETag(userId)
    const headers: Record<string, string> = {}
    if (etag) headers['If-None-Match'] = etag
    
    const tokens = loadTokens()
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/users/${userId}/profile-picture`, { headers })
      
      if (response.status === 304) {
        // Not modified - no update
        return
      }
      
      if (!response.ok) return
      
      const newEtag = response.headers.get('ETag')
      if (newEtag) setCachedProfilePictureETag(userId, newEtag)
      
      const data = await response.json()
      const url = data.data?.url ?? data.data?.profilePictureUrl ?? null
      
      if (url) {
        setCachedProfilePictureUrl(userId, url)
        onUpdate(url)
      }
    } catch {
      // Ignore polling errors
    }
  }
  
  // Initial fetch
  await poll()
  
  // Set up interval
  const intervalId = setInterval(poll, intervalMs)
  
  // Return cleanup function
  return () => {
    stopped = true
    clearInterval(intervalId)
  }
}

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

export interface BackendCohort {
  id: string
  name: string
}

export async function fetchCohorts(): Promise<BackendCohort[]> {
  return request<BackendCohort[]>('/api/v1/cohorts', { auth: false })
}

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------

export interface BackendQueue {
  id: string
  name?: string
  recurring?: boolean
  queueDate?: string | null
  maxCapacity: number
  isFull: boolean
  isOpen: boolean
  createdAt?: string
  createdDate?: string
  queueNumber?: number | null
  closureDate?: string | null
}

export interface BackendQueueUser {
  id?: string
  firstName?: string
  lastName?: string
  username: string
  email?: string
  role?: string
  cohort?: string
  whatsAppNumber?: string
  numberInQueue: number
  inQueue?: boolean
  checkedIn?: boolean
  profilePictureUrl?: string | null
  gender?: string | null
  queueId?: string
  message?: string
}

export interface BackendQueueEntry {
  queueId: string
  username: string
  numberInQueue: number
  isCheckedIn?: boolean
  checkedIn?: boolean
  profilePictureUrl?: string | null
  message?: string
}

export async function fetchAllQueues(): Promise<{ queues: BackendQueue[]; message: string; numberOfQueues: number | null }> {
  const result = await request<unknown>('/api/queue/all')
  // Handle both wrapped ({ queues, ... }) and direct array responses.
  if (Array.isArray(result)) {
    return { queues: result as BackendQueue[], message: '', numberOfQueues: result.length }
  }
  if (result && typeof result === 'object' && 'queues' in result) {
    return result as { queues: BackendQueue[]; message: string; numberOfQueues: number | null }
  }
  return { queues: [], message: '', numberOfQueues: null }
}

/** Join using the current 6-digit access code (TOTP, rotates every 30s). */
export async function enterQueue(userId: string, code: string, queueId?: string): Promise<BackendQueueEntry> {
  return request<BackendQueueEntry>(`/api/queue/${userId}/enter`, {
    method: 'POST',
    params: queueId ? { code, queueId } : { code },
  })
}

export async function closeQueue(queueId: string): Promise<void> {
  await request(`/api/queue/${queueId}/close`, { method: 'POST' })
}

export async function exitQueue(userId: string): Promise<void> {
  await request(`/api/queue/${userId}/exit`, { method: 'DELETE' })
}

export async function fetchQueueUsers(queueId: string): Promise<BackendQueueUser[]> {
  return request<BackendQueueUser[]>(`/api/queue/${queueId}/users`)
}

export async function fetchQueueStats(queueId: string): Promise<string> {
  return request<string>(`/api/queue/${queueId}/stats`)
}

export interface BackendCreateQueuePayload {
  maxCapacity: number
  name?: string
  recurring?: boolean
}

export async function createQueueOnBackend(payload: BackendCreateQueuePayload): Promise<unknown> {
  return request('/api/queue/create', { method: 'POST', body: payload })
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface BackendNotification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export async function fetchNotifications(): Promise<BackendNotification[]> {
  return request<BackendNotification[]>('/api/v1/notifications')
}

export async function fetchUnreadCount(): Promise<number> {
  return request<number>('/api/v1/notifications/unread/count')
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await request(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead(): Promise<void> {
  await request('/api/v1/notifications/read-all', { method: 'PATCH' })
}

// ---------------------------------------------------------------------------
// Health (also used by the keep-alive ping)
// ---------------------------------------------------------------------------

export interface BackendHealth {
  status: string
  service: string
  timestamp: string
  uptimeSeconds: number
}

export async function fetchHealth(): Promise<BackendHealth> {
  return request<BackendHealth>('/api/health', { auth: false, allowRefresh: false })
}
