import { flushPendingWrites } from '../lib/persist'
import { useQueueStore } from '../stores/queue'
import { useNotificationStore } from '../stores/notifications'

const USER_KEY = 'qin:user'
const DATA_KEY = 'qin:data:v3'
const NOTIFICATIONS_KEY = 'qin:notifications'
const PREFS_KEY = 'qin:prefs'

function clearSessionProfileCache(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith('qin:profile-picture')) keys.push(k)
    }
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch {}
}

export async function resetAppCache(): Promise<void> {
  flushPendingWrites()
  try {
    useQueueStore.setState({ cohorts: [], queues: [], activeTicket: null, lastJoinError: null })
  } catch {}
  try {
    useNotificationStore.setState({ items: [] })
  } catch {}
  clearSessionProfileCache()
  try {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(DATA_KEY)
    localStorage.removeItem(NOTIFICATIONS_KEY)
    localStorage.removeItem(PREFS_KEY)
  } catch {}
}
