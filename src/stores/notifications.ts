import { create } from 'zustand'
import type { AppNotification } from '../lib/types'
import { debouncedSaveJSON, loadJSON } from '../lib/persist'
import { uid } from '../lib/utils'

const KEY = 'qin:notifications'

interface NotificationState {
  items: AppNotification[]
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  push: (title: string, message: string, type?: AppNotification['type']) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: loadJSON<AppNotification[]>(KEY, []),

  markRead: (id) =>
    set((state) => {
      const items = state.items.map((item) => (item.id === id ? { ...item, read: true } : item))
      debouncedSaveJSON(KEY, items)
      return { items }
    }),

  markAllRead: () =>
    set((state) => {
      const items = state.items.map((item) => ({ ...item, read: true }))
      debouncedSaveJSON(KEY, items)
      return { items }
    }),

  remove: (id) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== id)
      debouncedSaveJSON(KEY, items)
      return { items }
    }),

  push: (title, message, type = 'QUEUE') =>
    set((state) => {
      const items = [
        { id: uid('ntf'), title, message, type, read: false, createdAt: new Date().toISOString() },
        ...state.items,
      ].slice(0, 40)
      debouncedSaveJSON(KEY, items)
      return { items }
    }),
}))

export const selectUnreadCount = (state: NotificationState) =>
  state.items.filter((item) => !item.read).length