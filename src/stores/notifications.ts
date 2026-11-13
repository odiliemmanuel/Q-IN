import { create } from 'zustand'
import type { AppNotification } from '../lib/types'
import { loadJSON, saveJSON } from '../lib/persist'
import { uid } from '../lib/utils'

const KEY = 'qin:notifications'

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

const SEED: AppNotification[] = [
  {
    id: 'ntf_1',
    title: 'Your turn is close',
    message: 'You are now #3 in Lab Equipment Checkout. Head over in the next 10 minutes.',
    type: 'QUEUE',
    read: false,
    createdAt: minutesAgo(3),
  },
  {
    id: 'ntf_2',
    title: 'Queue opened',
    message: 'Mentor Office Hours just opened for Frontend Engineering — Cohort 12.',
    type: 'QUEUE',
    read: false,
    createdAt: minutesAgo(42),
  },
  {
    id: 'ntf_3',
    title: 'Weekly summary ready',
    message: 'Your cohort served 86 people with an average wait of 11 minutes.',
    type: 'SYSTEM',
    read: true,
    createdAt: minutesAgo(60 * 20),
  },
  {
    id: 'ntf_4',
    title: 'New admin added',
    message: 'Zainab Musa was promoted to Super admin by the platform owner.',
    type: 'ADMIN',
    read: true,
    createdAt: minutesAgo(60 * 30),
  },
]

interface NotificationState {
  items: AppNotification[]
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  push: (title: string, message: string, type?: AppNotification['type']) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: loadJSON<AppNotification[]>(KEY, SEED),

  markRead: (id) =>
    set((state) => {
      const items = state.items.map((item) => (item.id === id ? { ...item, read: true } : item))
      saveJSON(KEY, items)
      return { items }
    }),

  markAllRead: () =>
    set((state) => {
      const items = state.items.map((item) => ({ ...item, read: true }))
      saveJSON(KEY, items)
      return { items }
    }),

  remove: (id) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== id)
      saveJSON(KEY, items)
      return { items }
    }),

  push: (title, message, type = 'QUEUE') =>
    set((state) => {
      const items = [
        { id: uid('ntf'), title, message, type, read: false, createdAt: new Date().toISOString() },
        ...state.items,
      ].slice(0, 40)
      saveJSON(KEY, items)
      return { items }
    }),
}))

export const selectUnreadCount = (state: NotificationState) =>
  state.items.filter((item) => !item.read).length
