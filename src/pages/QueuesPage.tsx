import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { QueueCard } from '../components/QueueCard'
import { Button, Card, EmptyState, Input, Modal, Select, Textarea } from '../components/ui'
import { IconPlus, IconQueue, IconSearch } from '../components/icons'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'
import { cn } from '../lib/utils'

type Tab = 'all' | 'open' | 'joined'

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
    cohortId: cohorts[0]?.id ?? '',
    description: '',
    capacity: '20',
    avgServiceMinutes: '10',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

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
        queue.description.toLowerCase().includes(needle) ||
        cohortName.toLowerCase().includes(needle)
      const matchesCohort = cohortFilter === 'all' || queue.cohortId === cohortFilter
      const matchesTab =
        tab === 'all' || (tab === 'open' ? queue.isOpen : activeTicket?.queueId === queue.id)
      return matchesSearch && matchesCohort && matchesTab
    })
  }, [queues, cohorts, q, cohortFilter, tab, activeTicket])

  const submitQueue = async (event: React.FormEvent) => {
    event.preventDefault()
    if (form.name.trim().length < 3) {
      setFormError('Give the queue a name of at least 3 characters.')
      return
    }
    if (!form.cohortId) {
      setFormError('Choose a cohort for this queue.')
      return
    }
    await addQueue({
      name: form.name.trim(),
      cohortId: form.cohortId,
      description: form.description.trim() || 'No description yet.',
      capacity: Math.max(1, Number(form.capacity) || 10),
      avgServiceMinutes: Math.max(1, Number(form.avgServiceMinutes) || 10),
    })
    notify('Queue created')
    setModalOpen(false)
    setForm({ name: '', cohortId: cohorts[0]?.id ?? '', description: '', capacity: '20', avgServiceMinutes: '10' })
    setFormError(null)
  }

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'all', label: 'All queues', count: queues.length },
    { id: 'open', label: 'Open', count: queues.filter((queue) => queue.isOpen).length },
    { id: 'joined', label: 'Joined', count: activeTicket ? 1 : 0 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queues"
        description="Browse every line across your cohorts — join a queue with a code or QR scan."
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
          <select
            value={cohortFilter}
            onChange={(event) => update('cohort', event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Filter by cohort"
          >
            <option value="all">All cohorts</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              cohortName={cohorts.find((cohort) => cohort.id === queue.cohortId)?.name ?? 'Cohort'}
              joined={activeTicket?.queueId === queue.id}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<IconQueue className="h-5 w-5" />}
            title="No queues match your filters"
            description="Try a different search term or cohort."
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
        description="Queues live inside a cohort and can be opened or closed at any time."
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
            placeholder="e.g. Mentor Office Hours"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Select
            label="Cohort"
            name="queue-cohort"
            value={form.cohortId}
            onChange={(event) => setForm({ ...form, cohortId: event.target.value })}
          >
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
              </option>
            ))}
          </Select>
          <Textarea
            label="Description"
            name="queue-description"
            placeholder="What is this queue for?"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Capacity"
              name="queue-capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
            />
            <Input
              label="Avg service (min)"
              name="queue-avg"
              type="number"
              min={1}
              value={form.avgServiceMinutes}
              onChange={(event) => setForm({ ...form, avgServiceMinutes: event.target.value })}
            />
          </div>
          {formError ? (
            <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{formError}</p>
          ) : null}
        </form>
      </Modal>
    </div>
  )
}
