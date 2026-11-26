'use client';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? window.location.origin
    : '');

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('qin:tokens');
    if (raw) {
      const parsed = JSON.parse(raw) as { accessToken?: string; refreshToken?: string };
      if (parsed?.accessToken) return parsed.accessToken;
    }
  } catch {}
  return localStorage.getItem('qin:accessToken');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Invalid response from server', response.status);
  }

  if (!response.ok || !data.success) {
    throw new ApiError(data.message ?? 'Request failed', response.status, data.data);
  }

  return data.data as T;
}

export const apiClient = {
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
};

export { getAccessToken };
