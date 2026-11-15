import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { QueueCard } from '../components/QueueCard'
import { Avatar, Button, Card, CardHeader, EmptyState, Progress } from '../components/ui'
import {
  IconArrowRight,
  IconChevronRight,
  IconClock,
  IconQueue,
  IconSparkles,
  IconUsers,
} from '../components/icons'
import { formatWait, greeting, timeAgo, waitMinutes } from '../lib/utils'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notifications'
import { positionOf, useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const queues = useQueueStore((state) => state.queues)
  const cohorts = useQueueStore((state) => state.cohorts)
  const activeTicket = useQueueStore((state) => state.activeTicket)
  const leaveQueue = useQueueStore((state) => state.leaveQueue)
  const notifications = useNotificationStore((state) => state.items)
  const notify = useUiStore((state) => state.notify)

  const openQueues = queues.filter((queue) => queue.isOpen)
  const totalWaiting = queues.reduce(
    (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'WAITING').length,
    0,
  )
  const avgWait = openQueues.length
    ? Math.round(openQueues.reduce((sum, queue) => sum + queue.avgServiceMinutes, 0) / openQueues.length)
    : 0

  const activeQueue = activeTicket ? queues.find((queue) => queue.id === activeTicket.queueId) : undefined
  const position = activeQueue && activeTicket ? positionOf(activeQueue, activeTicket.entryId) : 0
  const eta = activeQueue ? waitMinutes(position, activeQueue.avgServiceMinutes) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`${greeting()}, ${user?.name.split(' ')[0] ?? 'there'}`}
        description="Here is what is happening across your cohorts today."
        actions={
          <Link to="/app/queues">
            <Button leftIcon={<IconQueue className="h-4 w-4" />}>Browse queues</Button>
          </Link>
        }
      />

      {/* Active ticket / prompt */}
      {activeQueue && activeTicket ? (
        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-brand-700 via-brand-600 to-violet-700 p-6 text-white shadow-lg shadow-brand-900/20">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-violet-400/20 blur-2xl" aria-hidden="true" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-white/20">
                  In queue
                </span>
                <span className="truncate text-[12px] text-white/70">
                  {cohorts.find((cohort) => cohort.id === activeQueue.cohortId)?.name}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
                <p className="font-display text-5xl font-bold leading-none tracking-tight">
                  #{position}
                </p>
                <div className="pb-1">
                  <p className="text-[13px] font-medium text-white/90">{activeQueue.name}</p>
                  <p className="text-[12px] text-white/60">in line right now</p>
                </div>
              </div>

              <div className="mt-5 max-w-md">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-white/70">
                  <span>Estimated wait</span>
                  <span>{formatWait(eta)}</span>
                </div>
                <Progress
                  value={Math.max(1, position)}
                  max={Math.max(position, activeQueue.entries.filter((entry) => entry.status === 'WAITING').length)}
                  tone="white"
                  className="bg-white/20"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link to={`/app/queues/${activeQueue.id}`}>
                <Button variant="white" rightIcon={<IconArrowRight className="h-4 w-4" />}>
                  View queue
                </Button>
              </Link>
              <Button
                variant="ghostInverse"
                onClick={async () => {
                  await leaveQueue()
                  if (!useQueueStore.getState().activeTicket) notify('You left the queue.', 'info')
                }}
              >
                Leave queue
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-start justify-between gap-4 border-brand-200 bg-brand-50/50 p-5 sm:flex-row sm:items-center dark:border-brand-500/25 dark:bg-brand-500/10">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              <IconSparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                You are not in a queue yet
              </p>
              <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-400">
                Join a line and we will track your position and wait time in real time.
              </p>
            </div>
          </div>
          <Link to="/join">
            <Button size="sm" rightIcon={<IconArrowRight className="h-4 w-4" />}>
              Join with a code
            </Button>
          </Link>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Open queues" value={openQueues.length} hint={`${queues.length} total`} tone="brand" icon={<IconQueue className="h-4 w-4" />} />
        <MiniStat label="People waiting" value={totalWaiting} hint="across all cohorts" tone="violet" icon={<IconUsers className="h-4 w-4" />} />
        <MiniStat label="Your cohorts" value={cohorts.length} hint="active this term" tone="success" icon={<IconSparkles className="h-4 w-4" />} />
        <MiniStat label="Average wait" value={`${avgWait}m`} hint="open queues" tone="warning" icon={<IconClock className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
              Open right now
            </h2>
            <Link
              to="/app/queues"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              See all queues
              <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {openQueues.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {openQueues.slice(0, 4).map((queue) => (
                <QueueCard
                  key={queue.id}
                  queue={queue}
                  cohortName={cohorts.find((cohort) => cohort.id === queue.cohortId)?.name ?? 'Cohort'}
                  joined={activeTicket?.queueId === queue.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconQueue className="h-5 w-5" />}
              title="No open queues"
              description="Admins have closed all queues for now. Check back shortly."
            />
          )}
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Your cohorts" description="Jump back into a group." />
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {cohorts.map((cohort) => {
                const cohortQueues = queues.filter((queue) => queue.cohortId === cohort.id)
                const waiting = cohortQueues.reduce(
                  (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'WAITING').length,
                  0,
                )
                return (
                  <li key={cohort.id}>
                    <Link
                      to={`/app/queues?cohort=${cohort.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <Avatar name={cohort.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                          {cohort.name}
                        </p>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                          {cohort.memberCount} members · {waiting} waiting
                        </p>
                      </div>
                      <IconChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Recent activity" description="The last few things that happened." />
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.slice(0, 4).map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800 dark:text-slate-200">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.message}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-slate-200 bg-slate-900 p-5 text-white dark:border-slate-800">
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/20">
              Tip
            </span>
            <p className="mt-3 text-[13px] leading-relaxed text-white/80">
              Keep this tab open. Positions refresh automatically so you never miss your turn.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string
  value: React.ReactNode
  hint: string
  icon: React.ReactNode
  tone: 'brand' | 'violet' | 'success' | 'warning'
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">{hint}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      </div>
    </Card>
  )
}
