import { useEffect } from "react"
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { QueueCard } from '../components/QueueCard'
import { Button, Card, EmptyState, Input, Modal } from '../components/ui'
import { IconPlus, IconQueue, IconSearch } from '../components/icons'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'
import { cn } from '../lib/utils'

type Tab = 'all' | 'open' | 'joined' | 'history'

export function QueuesPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const queues = useQueueStore((state) => state.queues)
  const cohorts = useQueueStore((state) => state.cohorts)
  const activeTicket = useQueueStore((state) => state.activeTicket)
  const addQueue = useQueueStore((state) => state.addQueue)
  const user = useAuthStore((state) => state.user)
  const notify = useUiStore((state) => state.notify)

  const q = params.get('q') ?? ''
  const cohortFilter = params.get('cohort') ?? 'all'
  const tab = (params.get('tab') as Tab | null) ?? 'all'

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    capacity: '20',
    recurring: false,
    serviceTimeMinutes: 5,
    gracePeriodMinutes: 1,
  })
  const [formError, setFormError] = useState<string | null>(null)

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const today = new Date().toISOString().slice(0, 10)
  const hydrateFromBackend = useQueueStore((state) => state.hydrateFromBackend)
  const userName = user?.name

  useEffect(() => { void hydrateFromBackend() }, [hydrateFromBackend])

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return queues.filter((queue) => {
      const cohortName = cohorts.find((cohort) => cohort.id === queue.cohortId)?.name ?? ''
      const matchesSearch =
        !needle ||
        queue.name.toLowerCase().includes(needle) ||
        (queue.description ?? '').toLowerCase().includes(needle) ||
        cohortName.toLowerCase().includes(needle)
      const matchesCohort = cohortFilter === 'all' || queue.cohortId === cohortFilter
      
      // Check if user has history in this queue (served or skipped entries)
      const hasHistory = userName 
        ? queue.entries.some((entry) => 
            entry.name === userName && (entry.status === 'SERVED' || entry.status === 'SKIPPED'))
        : false
      
      const isJoined = activeTicket?.queueId === queue.id
      const isOpenToday = queue.isOpen && (!queue.queueDate || queue.queueDate === today)

      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'open'
            ? isOpenToday
            : tab === 'joined'
              ? isJoined
              : hasHistory
      return matchesSearch && matchesCohort && matchesTab
    })
  }, [queues, cohorts, q, cohortFilter, tab, activeTicket, today, userName])

  const submitQueue = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = form.name.trim() || 'General Queue'
    const capacity = Math.max(1, Number(form.capacity) || 20)
    const serviceTimeMinutes = Math.max(1, Number(form.serviceTimeMinutes) || 5)
    const gracePeriodMinutes = Math.max(0, Number(form.gracePeriodMinutes) || 1)
    setFormError(null)
    try {
      await addQueue({
        name,
        description: form.recurring ? 'Recurring daily queue' : 'Queue',
        capacity,
        avgServiceMinutes: serviceTimeMinutes,
        recurring: form.recurring,
        serviceTimeMinutes,
        gracePeriodMinutes,
      })
      notify('Queue created')
      setModalOpen(false)
      setForm({ name: '', capacity: '20', recurring: false, serviceTimeMinutes: 5, gracePeriodMinutes: 1 })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create queue')
    }
  }

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'all', label: 'All', count: queues.length },
    { id: 'open', label: "Today's open", count: queues.filter((q) => q.isOpen && (!q.queueDate || q.queueDate === today)).length },
    { id: 'joined', label: 'Joined', count: activeTicket ? 1 : 0 },
    { id: 'history', label: 'History', count: userName ? queues.filter((q) => q.entries.some((e) => e.name === userName && (e.status === 'SERVED' || e.status === 'SKIPPED'))).length : 0 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queues"
        description="Join today's active queues or manage recurring daily queues."
        actions={
          canManage ? (
            <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              New queue
            </Button>
          ) : (
            <Button leftIcon={<IconQueue className="h-4 w-4" />} onClick={() => navigate('/join')}>
              Join with code
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => update('tab', item.id === 'all' ? '' : item.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors',
                tab === item.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                  tab === item.id ? 'bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(event) => update('q', event.target.value)}
              placeholder="Search queues…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:w-64 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Search queues"
            />
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              cohortName={queue.queueDate ? `Date: ${queue.queueDate}` : (cohorts.find((cohort) => cohort.id === queue.cohortId)?.name ?? 'Queue')}
              joined={activeTicket?.queueId === queue.id}
              userId={user?.id}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<IconQueue className="h-5 w-5" />}
            title="No queues found"
            description="Try a different search or create a new queue."
            action={
              <Button variant="outline" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Clear filters
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create a queue"
        description="Create today's queue instance. Recurring queues create a fresh open instance each day with the same name."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitQueue}>Create queue</Button>
          </>
        }
      >
        <form onSubmit={submitQueue} className="space-y-4">
          <Input
            label="Queue name"
            name="queue-name"
            placeholder="General Queue"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Max capacity"
            name="queue-capacity"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(event) => setForm({ ...form, capacity: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Service time (minutes)"
              name="queue-service-time"
              type="number"
              min={1}
              max={120}
              value={form.serviceTimeMinutes}
              onChange={(event) => setForm({ ...form, serviceTimeMinutes: Number(event.target.value) || 5 })}
            />
            <Input
              label="Grace period (minutes)"
              name="queue-grace-period"
              type="number"
              min={0}
              max={30}
              value={form.gracePeriodMinutes}
              onChange={(event) => setForm({ ...form, gracePeriodMinutes: Number(event.target.value) || 1 })}
            />
          </div>
          <label className="flex items-center gap-2.5 text-[13px] text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Use every day / frequently used (recurring daily)
          </label>
          {formError ? (
            <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{formError}</p>
          ) : null}
        </form>
      </Modal>
    </div>
  )
}
