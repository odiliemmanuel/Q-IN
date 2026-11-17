const TOKENS_KEY = 'qin:tokens'
const ACCESS_TOKEN_KEY = 'qin:accessToken'
const REFRESH_TOKEN_KEY = 'qin:refreshToken'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  userId?: string
}

export const tokenStorage = {
  getAccess(): string | null {
    try {
      const tokens = localStorage.getItem(TOKENS_KEY)
      if (tokens) {
        const parsed = JSON.parse(tokens) as StoredTokens
        if (parsed?.accessToken) return parsed.accessToken
      }
    } catch {}
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefresh(): string | null {
    try {
      const tokens = localStorage.getItem(TOKENS_KEY)
      if (tokens) {
        const parsed = JSON.parse(tokens) as StoredTokens
        if (parsed?.refreshToken) return parsed.refreshToken
      }
    } catch {}
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  getUserId(): string | null {
    try {
      const tokens = localStorage.getItem(TOKENS_KEY)
      if (tokens) {
        const parsed = JSON.parse(tokens) as StoredTokens
        return parsed?.userId ?? null
      }
    } catch {}
    return null
  },
  set(access: string, refresh: string, userId?: string): void {
    try {
      localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: access, refreshToken: refresh, userId }))
    } catch {}
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKENS_KEY)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch {}
  },
}
