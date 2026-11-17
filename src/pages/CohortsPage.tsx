import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { Avatar, Badge, Button, Card, Input, Modal, Progress, Textarea } from '../components/ui'
import { IconArrowRight, IconPlus, IconQueue, IconUsers, IconActivity, IconAlert, IconTrash } from '../components/icons'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'

export function CohortsPage() {
  const cohorts = useQueueStore((state) => state.cohorts)
  const queues = useQueueStore((state) => state.queues)
  const addCohort = useQueueStore((state) => state.addCohort)
  const disableCohort = useQueueStore((state) => state.disableCohort)
  const deleteCohort = useQueueStore((state) => state.deleteCohort)
  const hydrateFromBackend = useQueueStore((state) => state.hydrateFromBackend)
  const user = useAuthStore((state) => state.user)
  const notify = useUiStore((state) => state.notify)
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [membersOpen, setMembersOpen] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState<{ id: string; name: string } | null>(null)

  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  // Fetch cohorts from backend when admin visits
  useEffect(() => {
    if (canManage) {
      hydrateFromBackend().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [canManage, hydrateFromBackend])

  // Index queues by cohortId once: O(n) instead of O(n*m) per render
  const queuesByCohort = useMemo(
    () => queues.reduce<Record<string, typeof queues>>((acc, q) => {
      const bucket = acc[q.cohortId ?? ''] ?? []
      acc[q.cohortId ?? ''] = [...bucket, q]
      return acc
    }, {} as Record<string, typeof queues>),
    [queues],
  )

  // Pre-compute cohort stats once: O(n + m) instead of O(n*m)
  const cohortsWithCounts = useMemo(
    () =>
      cohorts.map((cohort) => {
        const cohortQueues = queuesByCohort[cohort.id] ?? []
        const allEntryIds = new Set<string>()
        let waiting = 0
        for (const queue of cohortQueues) {
          for (const entry of queue.entries) {
            if (!allEntryIds.has(entry.id)) {
              allEntryIds.add(entry.id)
            }
            if (entry.status === 'WAITING') waiting += 1
          }
        }
        return { ...cohort, memberCount: allEntryIds.size, waiting, cohortQueues }
      }),
    [cohorts, queuesByCohort],
  )

  const viewMembers = (cohort: { id: string; name: string }) => {
    setSelectedCohort(cohort)
    setMembersOpen(true)
  }

  // Pre-compute unique members for the selected cohort: O(m) where m = entries in that cohort's queues
  const selectedMembers = useMemo(() => {
    if (!selectedCohort) return []
    const cohortQueues = queuesByCohort[selectedCohort.id] ?? []
    const seen = new Set<string>()
    const members: typeof queues[0]['entries'][number][] = []
    for (const queue of cohortQueues) {
      for (const entry of queue.entries) {
        if (!seen.has(entry.id)) {
          seen.add(entry.id)
          members.push(entry)
        }
      }
    }
    return members
  }, [selectedCohort, queuesByCohort])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 3) {
      setError('Cohort name must be at least 3 characters.')
      return
    }
    await addCohort(name.trim(), description.trim() || 'No description yet.')
    notify('Cohort created')
    setOpen(false)
    setName('')
    setDescription('')
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconActivity className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohorts"
        description="Every cohort, its queues and how many people are waiting right now."
        actions={
          canManage ? (
            <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              New cohort
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cohortsWithCounts.map((cohort) => {
          const { cohortQueues, waiting } = cohort
          const openQueues = cohortQueues.filter((queue) => queue.isOpen)

          return (
            <Card key={cohort.id} className="flex flex-col p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={cohort.name} size="md" />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                      {cohort.name}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      {cohort.memberCount} members
                    </p>
                  </div>
                </div>
                <Badge tone={openQueues.length ? 'success' : 'neutral'} dot>
                  {openQueues.length ? `${openQueues.length} open` : 'Idle'}
                </Badge>
              </div>

              <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {cohort.description}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Queues</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    {cohortQueues.length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Waiting</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">{waiting}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Members</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    {cohort.memberCount}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Queue activity</span>
                  <span>{waiting} in line</span>
                </div>
                <Progress value={waiting} max={Math.max(10, cohort.memberCount / 4)} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                  <IconQueue className="h-3.5 w-3.5" />
                  {openQueues.length} accepting entries
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    tone={cohort.isActive ? 'brand' : 'danger'}
                    className="capitalize"
                  >
                    {cohort.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                  {cohort.isActive && canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void disableCohort(cohort.id)}
                      title={`Disable ${cohort.name}`}
                    >
                      <IconAlert className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void deleteCohort(cohort.id)}
                      title={`Delete ${cohort.name}`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <Link
                  to={`/app/queues?cohort=${cohort.id}`}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  View queues
                  <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => viewMembers(cohort)}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <IconUsers className="h-3.5 w-3.5" />
                  View members
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <IconUsers className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
              {cohortsWithCounts.reduce((sum, c) => sum + c.memberCount, 0)} people across{' '}
              {cohortsWithCounts.length} cohorts
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Cohorts group people so queues stay relevant and manageable.
            </p>
          </div>
        </div>
        <Link to="/app/queues">
          <Button variant="outline" size="sm">
            Browse all queues
          </Button>
        </Link>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a cohort"
        description="Cohorts are groups of people who share queues."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Create cohort</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Cohort name"
            name="cohort-name"
            placeholder="e.g. Product Design — Cohort 5"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Textarea
            label="Description"
            name="cohort-description"
            placeholder="What is this cohort working on?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {error ? <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
        </form>
      </Modal>

      <Modal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        title={`Members — ${selectedCohort?.name}`}
        description="Everyone who has joined a queue in this cohort."
        footer={
          <Button variant="ghost" onClick={() => setMembersOpen(false)}>
            Done
          </Button>
        }
      >
        {selectedCohort ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[13px] font-medium text-slate-900 dark:text-white">
                {selectedMembers.length} member
                {selectedMembers.length !== 1 ? 's' : ''}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/app/queues?cohort=${selectedCohort.id}`)}
                className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                View queues
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {selectedMembers.map((entry) => (
                <div key={entry.id} className="flex flex-col items-center gap-2">
                  <Avatar name={entry.name} src={entry.avatar} size="sm" />
                  <p className="truncate text-[12px] font-medium text-slate-900 dark:text-white">
                    {entry.name}
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {entry.status === 'WAITING' ? 'Waiting' : entry.status === 'SERVED' ? 'Served' : 'Skipped'}
                  </span>
                </div>
              ))}
              {selectedMembers.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">
                  No members have joined queues in this cohort yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
