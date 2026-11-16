export type Role = 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'

export type QueueEntryStatus = 'WAITING' | 'SERVED' | 'SKIPPED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  emailVerified: boolean
  createdAt: string
  /** Avatar generated at signup (data URL). */
  avatar?: string
}

export interface QueueEntry {
  id: string
  name: string
  joinedAt: string
  status: QueueEntryStatus
  /** Avatar of the person in line (data URL). */
  avatar?: string
}

export interface Queue {
  id: string
  name: string
  cohortId?: string
  description: string
  capacity: number
  isOpen: boolean
  avgServiceMinutes: number
  /** Short code members enter (or scan as a QR) to join. */
  joinCode: string
  entries: QueueEntry[]
  createdAt: string
}

export interface Cohort {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'QUEUE' | 'SYSTEM' | 'ADMIN'
  read: boolean
  createdAt: string
}

export interface AdminRecord {
  id: string
  name: string
  email: string
  role: Role
  status: 'ACTIVE' | 'SUSPENDED'
  lastActive: string
}

export interface WebhookRecord {
  id: string
  endpoint: string
  events: string[]
  active: boolean
  deliveries: number
  failures: number
  createdAt: string
}

export interface ActiveTicket {
  queueId: string
  entryId: string
  joinedAt: string
}
