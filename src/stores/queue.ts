import { create } from 'zustand'
import type { ActiveTicket, Cohort, Queue, QueueEntry } from '../lib/types'
import { loadJSON, saveJSON } from '../lib/persist'
import { uid, generateJoinCode, normalizeJoinCode } from '../lib/utils'
import { useNotificationStore } from './notifications'
import { ApiError, loadTokens, enterQueue, exitQueue, fetchAllQueues, createQueueOnBackend, type BackendQueueUser } from '../lib/api'

const KEY = 'qin:data:v2'

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

export type JoinResult =
  | 'joined'
  | 'already-in-queue'
  | 'closed'
  | 'full'
  | 'missing'
  | 'invalid-code'

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
    default:
      return 'That queue could not be found.'
  }
}

/** Precise backend failure message for the most recent join attempt (API mode). */
function mapBackendUserToEntry(user: BackendQueueUser): QueueEntry {
  return {
    id: `bqe_${user.id}`,
    name: `${user.firstName} ${user.lastName}`.trim() || user.username,
    joinedAt: new Date().toISOString(),
    status: 'WAITING',
    avatar: user.caricatureUrl ?? undefined,
  }
}

/** Map a backend queue to the frontend Queue shape. */
function mapBackendQueue(backend: { id: string; maxCapacity: number; isOpen: boolean; isFull: boolean; createdAt: string }, index: number, users?: BackendQueueUser[]): Queue {
  return {
    id: backend.id,
    cohortId: 'cohort_live',
    name: `Live queue ${index > 0 ? `#${index + 1}` : ''}`.trim(),
    description: 'Queueni live queue — join with the rotating access code.',
    capacity: backend.maxCapacity,
    isOpen: backend.isOpen,
    avgServiceMinutes: 6,
    joinCode: 'TOTP',
    createdAt: backend.createdAt,
    entries: (users ?? [])
      .filter((user) => user.inQueue)
      .sort((a, b) => a.numberInQueue - b.numberInQueue)
      .map((user) => mapBackendUserToEntry(user)),
  }
}

interface QueueState extends PersistedData {
  /** Precise backend failure message for the latest join attempt (API mode). */
  lastJoinError: string | null
  joinQueue: (queueId: string, name: string, avatar?: string) => JoinResult
  joinByCode: (code: string, name: string, avatar?: string) => Promise<JoinResult>
  leaveQueue: () => Promise<void>
  /** Pull queues + members from the backend and merge into local state. */
  hydrateFromBackend: () => Promise<void>
  callNext: (queueId: string) => void
  serveEntry: (queueId: string, entryId: string) => void
  skipEntry: (queueId: string, entryId: string) => void
  toggleQueue: (queueId: string) => void
  addCohort: (name: string, description: string) => void
  addQueue: (input: {
    name: string
    cohortId: string
    description: string
    capacity: number
    avgServiceMinutes: number
  }) => Promise<void>
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
  ...loadJSON<PersistedData>(KEY, emptySeed),
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
      if (!mapped.length) return

      const current = get().queues
      const merged = [...mapped]
      for (const local of current) {
        if (!merged.some((item) => item.id === local.id)) merged.push(local)
      }
      set({ queues: merged })
      persist({ cohorts: get().cohorts, queues: merged, activeTicket: get().activeTicket })
    } catch {
      // Backend unreachable — keep whatever local state exists.
    }
  },

  joinByCode: async (code, name, avatar) => {
    const normalized = normalizeJoinCode(code)
    if (!normalized) {
      set({ lastJoinError: null })
      return 'invalid-code'
    }

    // API mode: the backend validates the current 6-digit TOTP access code.
    const tokens = loadTokens()
    if (tokens) {
      set({ lastJoinError: null })
      if (get().activeTicket) return 'already-in-queue'
      try {
        const entry = await enterQueue(tokens.userId, normalized)
        // Find (or create) the local mirror of the backend queue.
        let queues = get().queues
        let queue = queues.find((item) => item.id === entry.queueId)
        if (!queue) {
          try {
            const { queues: backendQueues } = await fetchAllQueues()
            const backend = backendQueues.find((item) => item.id === entry.queueId)
            queue = backend
              ? mapBackendQueue(backend, backendQueues.indexOf(backend))
              : mapBackendQueue(
                  { id: entry.queueId, maxCapacity: 40, isOpen: true, isFull: false, createdAt: new Date().toISOString() },
                  0,
                )
          } catch {
            queue = mapBackendQueue(
              { id: entry.queueId, maxCapacity: 40, isOpen: true, isFull: false, createdAt: new Date().toISOString() },
              0,
            )
          }
          queues = [queue, ...queues]
        }
        if (!queue.isOpen) {
          set({ lastJoinError: 'That queue is closed right now.' })
          return 'closed'
        }

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
        set({
          lastJoinError:
            error instanceof ApiError
              ? error.message
              : 'Could not reach the backend — it may be waking up. Try again shortly.',
        })
        return 'invalid-code'
      }
    }

    // Local mode: local join codes.
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

    // API mode: tell the backend first.
    const tokens = loadTokens()
    if (tokens) {
      try {
        await exitQueue(tokens.userId)
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400) {
          useNotificationStore.getState().push('Could not leave', error.message)
          return
        }
        // Unreachable backend — fall through to the local leave.
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

  toggleQueue: (queueId) => {
    const { queues, cohorts, activeTicket } = get()
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

  addCohort: (name, description) => {
    const { cohorts, queues, activeTicket } = get()
    const nextCohorts: Cohort[] = [
      {
        id: uid('cohort'),
        name,
        description,
        memberCount: 0,
        createdAt: new Date().toISOString(),
      },
      ...cohorts,
    ]
    persist({ cohorts: nextCohorts, queues, activeTicket })
    set({ cohorts: nextCohorts })
  },

  addQueue: async (input) => {
    const { cohorts, queues, activeTicket } = get()

    // API mode: create on the backend too (best effort — the backend only
    // allows one open queue at a time).
    if (loadTokens()) {
      try {
        await createQueueOnBackend({ queueId: input.name, maxCapacity: input.capacity })
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400) {
          useNotificationStore.getState().push('Backend queue not created', error.message)
        }
        // Unreachable backend — keep the local creation.
      }
    }

    const nextQueues: Queue[] = [
      {
        id: uid('queue'),
        name: input.name,
        cohortId: input.cohortId,
        description: input.description,
        capacity: input.capacity,
        isOpen: true,
        avgServiceMinutes: input.avgServiceMinutes,
        joinCode: generateJoinCode(),
        entries: [],
        createdAt: new Date().toISOString(),
      },
      ...queues,
    ]
    persist({ cohorts, queues: nextQueues, activeTicket })
    set({ queues: nextQueues })
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