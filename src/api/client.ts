import { API_BASE_URL, API_ENDPOINTS } from './config'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  totalPages: number
  totalElements: number
  size: number
  content: T[]
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

export class ApiError extends Error {
  public status: number
  public data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function getAuthToken(): Promise<string | null> {
  const token = localStorage.getItem('qin:accessToken')
  return token
}

async function getRefreshToken(): Promise<string | null> {
  const token = localStorage.getItem('qin:refreshToken')
  return token
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('qin:accessToken', accessToken)
  localStorage.setItem('qin:refreshToken', refreshToken)
}

function clearTokens(): void {
  localStorage.removeItem('qin:accessToken')
  localStorage.removeItem('qin:refreshToken')
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    const data: ApiResponse<{
      accessToken: string
      refreshToken: string
      userId: string
      role: string
      message: string
    }> = await response.json()

    if (data.success && data.data.accessToken) {
      setTokens(data.data.accessToken, data.data.refreshToken)
      return data.data.accessToken
    }
  } catch {
    // Ignore refresh errors
  }

  clearTokens()
  return null
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true,
  isRetry = false
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (requiresAuth) {
    const token = await getAuthToken()
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && requiresAuth && !isRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return request<T>(endpoint, options, requiresAuth, true)
    }
    clearTokens()
    window.location.href = '/login'
    throw new ApiError('Session expired. Please log in again.', 401)
  }

  let data: ApiResponse<T>
  try {
    data = await response.json()
  } catch {
    throw new ApiError('Invalid response from server', response.status)
  }

  if (!response.ok || !data.success) {
    throw new ApiError(data.message ?? 'Request failed', response.status, data.data)
  }

  return data.data as T
}

export const api = {
  get: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'GET' }, requiresAuth),

  post: <T>(endpoint: string, body?: unknown, requiresAuth = true) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, requiresAuth),

  patch: <T>(endpoint: string, body?: unknown, requiresAuth = true) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }, requiresAuth),

  put: <T>(endpoint: string, body?: unknown, requiresAuth = true) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, requiresAuth),

  delete: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'DELETE' }, requiresAuth),

  upload: <T>(endpoint: string, formData: FormData, requiresAuth = true, isRetryUpload = false) => {
    const headers: HeadersInit = {}
    const doUpload = async (retry = false): Promise<T> => {
      if (requiresAuth) {
        const token = await getAuthToken()
        if (token) headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (response.status === 401 && requiresAuth && !retry) {
        const newToken = await refreshAccessToken()
        if (newToken) {
          return doUpload(true)
        }
        clearTokens()
        window.location.href = '/login'
        throw new ApiError('Session expired. Please log in again.', 401)
      }

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new ApiError(data.message ?? 'Upload failed', response.status, data.data)
      }
      return data.data as T
    }

    return doUpload(isRetryUpload)
  },
}

export { getAuthToken, getRefreshToken, setTokens, clearTokens, refreshAccessToken }