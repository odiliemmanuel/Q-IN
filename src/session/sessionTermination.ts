import { tokenStorage } from '../auth/tokenStorage'
import { socketClient } from '../realtime/socketClient'
import { resetAppCache } from '../cache/resetAppCache'
import { ROUTES } from '../navigation/routes'

let inFlight: Promise<void> | null = null

async function logoutWithTimeout(ms = 1200): Promise<void> {
  const token = tokenStorage.getAccess()
  if (!token) return
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    await fetch('/api/v1/users/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
  } catch {
    /* best-effort: local cleanup remains authoritative */
  } finally {
    clearTimeout(timeout)
  }
}

export async function terminateSession(opts?: { navigate?: (to: string, options?: { replace?: boolean }) => void }): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      await logoutWithTimeout()
    } finally {
      await socketClient.disconnect().catch(() => {})
      tokenStorage.clear()
      await resetAppCache().catch(() => {})
      try {
        localStorage.removeItem('qin:queues')
        localStorage.removeItem('qin:cohorts')
      } catch {}
      // lazy import to avoid circular deps
      try {
        const { useAuthStore } = await import('../stores/auth')
        useAuthStore.setState({ user: null, error: null })
      } catch {}
      try {
        const { useUiStore } = await import('../stores/ui')
        useUiStore.setState({ toasts: [], confirm: null } as any)
      } catch {}
      if (opts?.navigate) {
        opts.navigate(ROUTES.login, { replace: true })
      } else {
        try {
          const { redirectToLogin } = await import('../navigation/routes')
          redirectToLogin()
        } catch {}
      }
    }
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}
