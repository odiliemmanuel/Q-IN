import { create } from 'zustand'
import type { ActiveTicket, Cohort, Queue, QueueEntry } from '../lib/types'
import { loadJSON, saveJSON } from '../lib/persist'
import { uid } from '../lib/utils'
import { useNotificationStore } from './notifications'

const KEY = 'qin:data:v1'

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function entry(name: string, minutes: number, status: QueueEntry['status'] = 'WAITING'): QueueEntry {
  return { id: uid('ent'), name, joinedAt: minutesAgo(minutes), status }
}

const SEED_COHORTS: Cohort[] = [
  {
    id: 'cohort_frontend',
    name: 'Frontend Engineering',
    description: 'Cohort 12 · React, TypeScript and design systems',
    memberCount: 128,
    createdAt: daysAgo(120),
  },
  {
    id: 'cohort_data',
    name: 'Data Science',
    description: 'Cohort 7 · Python, statistics and applied ML',
    memberCount: 94,
    createdAt: daysAgo(96),
  },
  {
    id: 'cohort_design',
    name: 'Product Design',
    description: 'Cohort 4 · Research, prototyping and critique',
    memberCount: 61,
    createdAt: daysAgo(74),
  },
  {
    id: 'cohort_backend',
    name: 'Backend Engineering',
    description: 'Cohort 9 · APIs, databases and distributed systems',
    memberCount: 110,
    createdAt: daysAgo(58),
  },
]

const SEED_QUEUES: Queue[] = [
  {
    id: 'queue_lab',
    name: 'Lab Equipment Checkout',
    cohortId: 'cohort_frontend',
    description: 'Collect laptops, adapters and testing devices for the week.',
    capacity: 40,
    isOpen: true,
    avgServiceMinutes: 6,
    createdAt: daysAgo(40),
    entries: [
      entry('Chinedu Eze', 34),
      entry('Amara Nwosu', 29),
      entry('Adaeze Nwankwo', 24),
      entry('Femi Adeyemi', 21),
      entry('Grace Etim', 17),
      entry('Ibrahim Sule', 12),
      entry('Ngozi Obi', 9),
      entry('Kelechi Umeh', 5),
      entry('Sade Lawal', 2),
    ],
  },
  {
    id: 'queue_mentor',
    name: 'Mentor Office Hours',
    cohortId: 'cohort_frontend',
    description: '15-minute 1:1 sessions with a senior engineer.',
    capacity: 20,
    isOpen: true,
    avgServiceMinutes: 12,
    createdAt: daysAgo(38),
    entries: [
      entry('Tobi Alabi', 22),
      entry('Halima Yusuf', 16),
      entry('Emeka Duru', 11),
      entry('Bisi Ogunleye', 6),
      entry('Yusuf Bello', 2),
    ],
  },
  {
    id: 'queue_review',
    name: 'Project Review',
    cohortId: 'cohort_data',
    description: 'Present your capstone and collect structured feedback.',
    capacity: 15,
    isOpen: false,
    avgServiceMinutes: 15,
    createdAt: daysAgo(30),
    entries: [],
  },
  {
    id: 'queue_critique',
    name: 'Design Critique',
    cohortId: 'cohort_design',
    description: 'Bring one flow and get critique from the design pod.',
    capacity: 12,
    isOpen: true,
    avgServiceMinutes: 10,
    createdAt: daysAgo(26),
    entries: [
      entry('Ifeoma Chukwu', 18),
      entry('David Ojo', 14),
      entry('Zara Ahmed', 9),
      entry('Peter Okon', 4),
    ],
  },
  {
    id: 'queue_swap',
    name: 'Code Review Swap',
    cohortId: 'cohort_backend',
    description: 'Pair up and review a pull request end to end.',
    capacity: 25,
    isOpen: true,
    avgServiceMinutes: 8,
    createdAt: daysAgo(20),
    entries: [
      entry('Musa Danjuma', 26),
      entry('Chioma Ibe', 19),
      entry('Segun Balogun', 13),
      entry('Aisha Garba', 7),
      entry('Uche Nnamdi', 3),
      entry('Lara Adebayo', 1),
    ],
  },
]

interface PersistedData {
  cohorts: Cohort[]
  queues: Queue[]
  activeTicket: ActiveTicket | null
}

const seed: PersistedData = {
  cohorts: SEED_COHORTS,
  queues: SEED_QUEUES,
  activeTicket: null,
}

export type JoinResult = 'joined' | 'already-in-queue' | 'closed' | 'full' | 'missing'

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
    default:
      return 'That queue could not be found.'
  }
}

interface QueueState extends PersistedData {
  joinQueue: (queueId: string, name: string) => JoinResult
  leaveQueue: () => void
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
  }) => void
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
  ...loadJSON<PersistedData>(KEY, seed),

  joinQueue: (queueId, name) => {
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

  leaveQueue: () => {
    const { queues, activeTicket, cohorts } = get()
    if (!activeTicket) return

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

  addQueue: (input) => {
    const { cohorts, queues, activeTicket } = get()
    const nextQueues: Queue[] = [
      {
        id: uid('queue'),
        name: input.name,
        cohortId: input.cohortId,
        description: input.description,
        capacity: input.capacity,
        isOpen: true,
        avgServiceMinutes: input.avgServiceMinutes,
        entries: [],
        createdAt: new Date().toISOString(),
      },
      ...queues,
    ]
    persist({ cohorts, queues: nextQueues, activeTicket })
    set({ queues: nextQueues })
  },

  resetDemoData: () => {
    persist(seed)
    set({ ...seed })
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
