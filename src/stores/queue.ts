import { create } from 'zustand'
import type { ActiveTicket, Cohort, Queue, QueueEntry } from '../lib/types'
import { loadJSON, saveJSON } from '../lib/persist'
import { uid, generateJoinCode, normalizeJoinCode } from '../lib/utils'
import { useNotificationStore } from './notifications'
import {
  ApiError,
  loadTokens,
  enterQueue,
  exitQueue,
  fetchAllQueues,
  createQueueOnBackend,
  fetchCohorts,
  closeQueue as closeQueueOnBackend,
  type BackendQueueUser,
  type BackendQueue,
  getCachedProfilePictureUrl,
  setCachedProfilePictureUrl,
} from '../lib/api'
import { cohortsApi } from '../api'

const KEY = 'qin:data:v3'
const STORAGE_VERSION = 3

interface PersistedData {
  cohorts: Cohort[]
  queues: Queue[]
  activeTicket: ActiveTicket | null
}

const emptySeed: PersistedData = {
  cohorts: [],
  queues: [],
  activeTicket: null,
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function migrateStorage(): PersistedData {
  const stored = loadJSON<PersistedData>(KEY, emptySeed)
  const version = parseInt(localStorage.getItem('qin:version') ?? '0', 10)
  if (version < STORAGE_VERSION) {
    localStorage.setItem('qin:version', String(STORAGE_VERSION))
    return emptySeed
  }
  return stored
}

export type JoinResult =
  | 'joined'
  | 'already-in-queue'
  | 'closed'
  | 'full'
  | 'missing'
  | 'invalid-code'
  | 'select-queue'

export function joinResultMessage(result: JoinResult): string {
  switch (result) {
    case 'joined':
      return 'You joined the queue — we will keep you posted.'
    case 'already-in-queue':
      return 'Leave your current queue first.'
    case 'closed':
      return 'This queue is closed right now.'
    case 'full':
      return 'This queue is full — try again once someone is served.'
    case 'invalid-code':
      return 'That code does not match any open queue.'
    case 'select-queue':
      return 'Multiple active queues available. Please select a queue.'
    default:
      return 'That queue could not be found.'
  }
}

function joinableQueues(queues: Queue[], date = todayISO()): Queue[] {
  return queues.filter((q) => q.isOpen && (q.queueDate ? q.queueDate === date : true))
}

/** Map backend queue user/entry to frontend entry. */
function mapBackendUserToEntry(user: BackendQueueUser): QueueEntry {
  const id = user.id ?? user.username
  const avatar = user.profilePictureUrl ?? getCachedProfilePictureUrl(id) ?? undefined
  if (user.profilePictureUrl) setCachedProfilePictureUrl(id, user.profilePictureUrl)

  const name =
    (user.firstName || user.lastName)
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user.username

  return {
    id: `bqe_${id}`,
    name,
    joinedAt: new Date().toISOString(),
    status: user.checkedIn ? 'SERVED' : 'WAITING',
    avatar,
    role: user.role,
    gender: user.gender ?? undefined,
    cohort: user.cohort,
    whatsAppNumber: user.whatsAppNumber,
    checkedIn: Boolean(user.checkedIn),
  }
}

/** Map a backend queue to the frontend Queue shape. */
function mapBackendQueue(backend: BackendQueue, index = 0, users?: BackendQueueUser[]): Queue {
  const name = backend.name?.trim() || `Queue ${index + 1}`
  const queueDate = backend.queueDate ?? (backend.createdAt ? backend.createdAt.slice(0, 10) : null)
  return {
    id: backend.id,
    cohortId: 'cohort_live',
    name,
    description: backend.recurring ? `Recurring queue${queueDate ? ` · ${queueDate}` : ''}` : 'Queueni live queue — join with the rotating access code.',
    capacity: backend.maxCapacity,
    isOpen: backend.isOpen,
    isFull: backend.isFull,
    recurring: Boolean(backend.recurring),
    queueDate,
    avgServiceMinutes: 6,
    joinCode: 'TOTP',
    createdAt: backend.createdAt ?? backend.createdDate ?? new Date().toISOString(),
    entries: (users ?? [])
      .filter((user) => user.inQueue !== false && !user.checkedIn)
      .sort((a, b) => (a.numberInQueue ?? 0) - (b.numberInQueue ?? 0))
      .map((user) => mapBackendUserToEntry(user)),
  }
}

interface QueueState extends PersistedData {
  lastJoinError: string | null
  joinQueue: (queueId: string, name: string, avatar?: string) => JoinResult
  joinByCode: (code: string, name: string, avatar?: string, queueId?: string) => Promise<JoinResult>
  leaveQueue: () => Promise<void>
  hydrateFromBackend: () => Promise<void>
  callNext: (queueId: string) => void
  serveEntry: (queueId: string, entryId: string) => void
  skipEntry: (queueId: string, entryId: string) => void
  toggleQueue: (queueId: string) => Promise<void>
  addCohort: (name: string, description: string) => void
  addQueue: (input: {
    name: string
    cohortId?: string
    description: string
    capacity: number
    avgServiceMinutes: number
    recurring?: boolean
  }) => Promise<void>
  updateQueueCapacity: (queueId: string, capacity: number) => Promise<void>
  deleteQueue: (queueId: string) => Promise<void>
  closeQueue: (queueId: string) => Promise<void>
  resetDemoData: () => void
}

function persist(state: PersistedData) {
  saveJSON(KEY, {
    cohorts: state.cohorts,
    queues: state.queues,
    activeTicket: state.activeTicket,
  })
}

export const useQueueStore = create<QueueState>((set, get) => ({
  ...migrateStorage(),
  lastJoinError: null,

  joinQueue: (queueId, name, avatar) => {
    const { queues, activeTicket } = get()
    const queue = queues.find((item) => item.id === queueId)
    if (!queue) return 'missing'
    if (!queue.isOpen) return 'closed'
    if (activeTicket) return 'already-in-queue'
    if (queue.entries.filter((entry) => entry.status === 'WAITING').length >= queue.capacity) {
      return 'full'
    }

    const newEntry: QueueEntry = {
      id: uid('ent'),
      name,
      joinedAt: new Date().toISOString(),
      status: 'WAITING',
      avatar,
    }

    const nextQueues = queues.map((item) =>
      item.id === queueId ? { ...item, entries: [...item.entries, newEntry] } : item,
    )
    const nextTicket: ActiveTicket = {
      queueId,
      entryId: newEntry.id,
      joinedAt: newEntry.joinedAt,
    }

    persist({ cohorts: get().cohorts, queues: nextQueues, activeTicket: nextTicket })
    set({ queues: nextQueues, activeTicket: nextTicket })
    useNotificationStore
      .getState()
      .push('You joined the queue', `You are in line for ${queue.name}. We'll let you know when you're close.`)
    return 'joined'
  },

  hydrateFromBackend: async () => {
    if (!loadTokens()) return
    try {
      const { queues: backendQueues } = await fetchAllQueues()
      const mapped = backendQueues.map((queue, index) => mapBackendQueue(queue, index))

      const backendCohorts = await fetchCohorts().catch(() => [])
      const mappedCohorts: Cohort[] = backendCohorts.map((c) => ({
        id: c.id,
        name: c.name,
        description: '',
        memberCount: 0,
        createdAt: new Date().toISOString(),
      }))

      const current = get().queues
      const merged = [...mapped]
      for (const local of current) {
        if (!merged.some((item) => item.id === local.id)) merged.push(local)
      }
      set({ queues: merged, cohorts: mappedCohorts.length ? mappedCohorts : get().cohorts })
      persist({ cohorts: get().cohorts, queues: merged, activeTicket: get().activeTicket })
    } catch {
      // Backend unreachable — keep whatever local state exists.
    }
  },

  joinByCode: async (code, name, avatar, queueId) => {
    const normalized = normalizeJoinCode(code)
    if (!normalized) {
      set({ lastJoinError: null })
      return 'invalid-code'
    }

    const tokens = loadTokens()
    if (tokens) {
      set({ lastJoinError: null })
      if (get().activeTicket) return 'already-in-queue'

      // If multiple active queues today, require explicit selection
      const active = joinableQueues(get().queues)
      if (!queueId && active.length > 1) {
        set({ lastJoinError: 'Multiple active queues available. Please select a queue.' })
        return 'select-queue'
      }
      const targetQueueId = queueId ?? active[0]?.id

      try {
        const entry = await enterQueue(tokens.userId, normalized, targetQueueId)
        let queues = get().queues
        const resolvedQueueId = entry.queueId || targetQueueId
        let queue = resolvedQueueId ? queues.find((item) => item.id === resolvedQueueId) : undefined
        if (!queue) {
          try {
            const { queues: backendQueues } = await fetchAllQueues()
            const backend = backendQueues.find((item) => item.id === resolvedQueueId) ?? backendQueues[0]
            if (backend) {
              queue = mapBackendQueue(backend, backendQueues.indexOf(backend))
            }
          } catch {
            // ignore
          }
        }
        if (!queue) {
          set({ lastJoinError: 'That queue could not be found.' })
          return 'missing'
        }
        if (!queues.some((q) => q.id === queue.id)) queues = [queue, ...queues]

        const newEntry: QueueEntry = {
          id: `bqe_self_${tokens.userId}`,
          name,
          joinedAt: new Date().toISOString(),
          status: 'WAITING',
          avatar,
        }
        const nextQueues = queues.map((item) =>
          item.id === queue.id ? { ...item, entries: [...item.entries, newEntry] } : item,
        )
        const nextTicket: ActiveTicket = {
          queueId: queue.id,
          entryId: newEntry.id,
          joinedAt: newEntry.joinedAt,
        }
        persist({ cohorts: get().cohorts, queues: nextQueues, activeTicket: nextTicket })
        set({ queues: nextQueues, activeTicket: nextTicket })
        useNotificationStore
          .getState()
          .push('You joined the queue', `You are in line for ${queue.name}. We'll let you know when you're close.`)
        return 'joined'
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : 'Could not reach the backend — it may be waking up. Try again shortly.'
        set({ lastJoinError: message })
        if (error instanceof ApiError && /multiple active queues/i.test(error.message)) {
          return 'select-queue'
        }
        return 'invalid-code'
      }
    }

    const { queues } = get()
    const queue = queues.find(
      (item) => item.joinCode.toUpperCase() === normalized || item.id === normalized.toLowerCase(),
    )
    if (!queue) return 'invalid-code'
    return get().joinQueue(queue.id, name, avatar)
  },

  leaveQueue: async () => {
    const { queues, activeTicket, cohorts } = get()
    if (!activeTicket) return

    const tokens = loadTokens()
    if (tokens) {
      try {
        await exitQueue(tokens.userId)
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400) {
          useNotificationStore.getState().push('Could not leave', error.message)
          return
        }
      }
    }

    const nextQueues = queues.map((queue) =>
      queue.id === activeTicket.queueId
        ? { ...queue, entries: queue.entries.filter((item) => item.id !== activeTicket.entryId) }
        : queue,
    )

    persist({ cohorts, queues: nextQueues, activeTicket: null })
    set({ queues: nextQueues, activeTicket: null })
    useNotificationStore.getState().push('You left the queue', 'Your spot was released to the next person.')
  },

  callNext: (queueId) => {
    const { queues, cohorts, activeTicket } = get()
    const queue = queues.find((item) => item.id === queueId)
    if (!queue) return
    const next = queue.entries.find((item) => item.status === 'WAITING')
    if (!next) return

    const nextQueues = queues.map((item) =>
      item.id === queueId
        ? {
            ...item,
            entries: item.entries.map((entryItem) =>
              entryItem.id === next.id ? { ...entryItem, status: 'SERVED' as const } : entryItem,
            ),
          }
        : item,
    )
    const nextTicket = activeTicket?.entryId === next.id ? null : activeTicket
    persist({ cohorts, queues: nextQueues, activeTicket: nextTicket })
    set({ queues: nextQueues, activeTicket: nextTicket })
    useNotificationStore.getState().push('Now serving', `${next.name} was called for ${queue.name}.`, 'QUEUE')
  },

  serveEntry: (queueId, entryId) => {
    const { queues, cohorts, activeTicket } = get()
    const queue = queues.find((item) => item.id === queueId)
    if (!queue) return
    const target = queue.entries.find((item) => item.id === entryId)
    if (!target || target.status !== 'WAITING') return

    const nextQueues = queues.map((item) =>
      item.id === queueId
        ? {
            ...item,
            entries: item.entries.map((entryItem) =>
              entryItem.id === entryId ? { ...entryItem, status: 'SERVED' as const } : entryItem,
            ),
          }
        : item,
    )
    const nextTicket = activeTicket?.entryId === entryId ? null : activeTicket
    persist({ cohorts, queues: nextQueues, activeTicket: nextTicket })
    set({ queues: nextQueues, activeTicket: nextTicket })
    useNotificationStore.getState().push('Now serving', `${target.name} was called for ${queue.name}.`, 'QUEUE')
  },

  skipEntry: (queueId, entryId) => {
    const { queues, cohorts, activeTicket } = get()
    const nextQueues = queues.map((item) =>
      item.id === queueId
        ? {
            ...item,
            entries: item.entries.map((entryItem) =>
              entryItem.id === entryId ? { ...entryItem, status: 'SKIPPED' as const } : entryItem,
            ),
          }
        : item,
    )
    const nextTicket = activeTicket?.entryId === entryId ? null : activeTicket
    persist({ cohorts, queues: nextQueues, activeTicket: nextTicket })
    set({ queues: nextQueues, activeTicket: nextTicket })
  },

  toggleQueue: async (queueId) => {
    const { queues, cohorts, activeTicket } = get()
    const current = queues.find((q) => q.id === queueId)
    if (!current) return

    // Closing via backend endpoint for today's instance (spec)
    if (current.isOpen && loadTokens()) {
      try {
        await closeQueueOnBackend(queueId)
      } catch {
        // fall through to local toggle
      }
    }

    const nextQueues = queues.map((item) =>
      item.id === queueId ? { ...item, isOpen: !item.isOpen } : item,
    )
    persist({ cohorts, queues: nextQueues, activeTicket })
    set({ queues: nextQueues })
    const queue = nextQueues.find((item) => item.id === queueId)
    if (queue) {
      useNotificationStore
        .getState()
        .push(
          queue.isOpen ? 'Queue opened' : 'Queue closed',
          `${queue.name} is now ${queue.isOpen ? 'accepting people' : 'closed to new entries'}.`,
          'SYSTEM',
        )
    }
  },

  closeQueue: async (queueId) => {
    const { queues, cohorts, activeTicket } = get()
    if (loadTokens()) {
      try {
        await closeQueueOnBackend(queueId)
      } catch {
        // local fallback
      }
    }
    const nextQueues = queues.map((item) => (item.id === queueId ? { ...item, isOpen: false } : item))
    persist({ cohorts, queues: nextQueues, activeTicket })
    set({ queues: nextQueues })
  },

  addCohort: async (name, description) => {
    const { cohorts, queues, activeTicket } = get()
    const newCohort = {
      id: uid('cohort'),
      name,
      description,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    }

    if (loadTokens()) {
      try {
        const backendCohort = await cohortsApi.createCohort({ name, description })
        newCohort.id = backendCohort.id
      } catch {
        // Backend creation failed, but keep local cohort
      }
    }

    const nextCohorts: Cohort[] = [newCohort, ...cohorts]
    persist({ cohorts: nextCohorts, queues, activeTicket })
    set({ cohorts: nextCohorts })
  },

  addQueue: async (input) => {
    const { cohorts, queues, activeTicket } = get()
    let created: Queue | null = null

    if (loadTokens()) {
      try {
        const backend = await createQueueOnBackend({
          maxCapacity: input.capacity,
          name: input.name,
          recurring: input.recurring,
        }) as any
        if (backend && backend.id) {
          created = mapBackendQueue(backend as BackendQueue, queues.length)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400) {
          useNotificationStore.getState().push('Backend queue not created', error.message)
        }
      }
    }

    const cohortId = input.cohortId ?? cohorts[0]?.id ?? `cohort_${uid()}`
    const nextQueue: Queue = created ?? {
      id: uid('queue'),
      name: input.name,
      cohortId,
      description: input.description,
      capacity: input.capacity,
      isOpen: true,
      recurring: Boolean(input.recurring),
      queueDate: todayISO(),
      avgServiceMinutes: input.avgServiceMinutes,
      joinCode: generateJoinCode(),
      entries: [],
      createdAt: new Date().toISOString(),
    }
    nextQueue.description = input.description || nextQueue.description
    nextQueue.avgServiceMinutes = input.avgServiceMinutes
    nextQueue.cohortId = cohortId

    const nextQueues: Queue[] = [nextQueue, ...queues]
    persist({ cohorts, queues: nextQueues, activeTicket })
    set({ queues: nextQueues })
  },

  updateQueueCapacity: async (queueId, capacity) => {
    const { queues, cohorts, activeTicket } = get()
    if (loadTokens()) {
      try {
        const { queuesApi } = await import('../api')
        await queuesApi.updateCapacity(capacity)
      } catch (error) {
        console.warn('Failed to update queue capacity on backend:', error)
      }
    }
    const nextQueues = queues.map((item) => (item.id === queueId ? { ...item, capacity } : item))
    persist({ cohorts, queues: nextQueues, activeTicket })
    set({ queues: nextQueues })
  },

  deleteQueue: async (queueId) => {
    const { queues, cohorts, activeTicket } = get()
    if (loadTokens()) {
      try {
        const { queuesApi } = await import('../api')
        await queuesApi.deleteQueue(queueId)
      } catch (error) {
        console.warn('Failed to delete queue on backend:', error)
      }
    }
    const nextQueues = queues.filter((item) => item.id !== queueId)
    const nextTicket = activeTicket?.queueId === queueId ? null : activeTicket
    persist({ cohorts, queues: nextQueues, activeTicket: nextTicket })
    set({ queues: nextQueues, activeTicket: nextTicket })
  },

  resetDemoData: () => {
    persist(emptySeed)
    set({ ...emptySeed })
  },
}))

export function waitingEntries(queue: Queue): QueueEntry[] {
  return queue.entries.filter((item) => item.status === 'WAITING')
}

export function positionOf(queue: Queue, entryId: string): number {
  const waiting = waitingEntries(queue)
  const index = waiting.findIndex((item) => item.id === entryId)
  return index === -1 ? 0 : index + 1
}

export function totalWaiting(queues: Queue[]): number {
  return queues.reduce((sum, queue) => sum + waitingEntries(queue).length, 0)
}

export function getJoinableQueues(queues: Queue[], date = todayISO()): Queue[] {
  return joinableQueues(queues, date)
}