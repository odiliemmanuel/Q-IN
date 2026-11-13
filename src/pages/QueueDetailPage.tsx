import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Progress,
} from '../components/ui'
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconPause,
  IconPlay,
  IconQueue,
  IconUsers,
} from '../components/icons'
import { cn, formatTime, formatWait, timeAgo, waitMinutes } from '../lib/utils'
import { useAuthStore } from '../stores/auth'
import { joinResultMessage, positionOf, useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'

export function QueueDetailPage() {
  const { queueId } = useParams<{ queueId: string }>()
  const navigate = useNavigate()
  const queues = useQueueStore((state) => state.queues)
  const cohorts = useQueueStore((state) => state.cohorts)
  const activeTicket = useQueueStore((state) => state.activeTicket)
  const joinQueue = useQueueStore((state) => state.joinQueue)
  const leaveQueue = useQueueStore((state) => state.leaveQueue)
  const callNext = useQueueStore((state) => state.callNext)
  const serveEntry = useQueueStore((state) => state.serveEntry)
  const skipEntry = useQueueStore((state) => state.skipEntry)
  const toggleQueue = useQueueStore((state) => state.toggleQueue)
  const user = useAuthStore((state) => state.user)
  const notify = useUiStore((state) => state.notify)

  const queue = queues.find((item) => item.id === queueId)

  if (!queue) {
    return (
      <div className="space-y-6">
        <Link to="/app/queues" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400">
          <IconArrowLeft className="h-4 w-4" />
          Back to queues
        </Link>
        <Card>
          <EmptyState
            icon={<IconQueue className="h-5 w-5" />}
            title="Queue not found"
            description="This queue may have been removed or the link is incorrect."
            action={
              <Link to="/app/queues">
                <Button size="sm">Browse queues</Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  const cohort = cohorts.find((item) => item.id === queue.cohortId)
  const waiting = queue.entries.filter((entry) => entry.status === 'WAITING')
  const history = queue.entries.filter((entry) => entry.status !== 'WAITING')
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isMine = activeTicket?.queueId === queue.id
  const position = activeTicket && isMine ? positionOf(queue, activeTicket.entryId) : 0
  const eta = waitMinutes(position, queue.avgServiceMinutes)

  const handleJoin = () => {
    const result = joinQueue(queue.id, user?.name ?? 'You')
    notify(joinResultMessage(result), result === 'joined' ? 'success' : 'error')
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/queues"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <IconArrowLeft className="h-4 w-4" />
        Back to queues
      </Link>

      <PageHeader
        eyebrow={cohort?.name}
        title={queue.name}
        description={queue.description}
        actions={
          <>
            <Badge tone={queue.isOpen ? 'success' : 'neutral'} dot>
              {queue.isOpen ? 'Open' : 'Closed'}
            </Badge>
            {isAdmin ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={queue.isOpen ? <IconPause className="h-4 w-4" /> : <IconPlay className="h-4 w-4" />}
                onClick={() => {
                  toggleQueue(queue.id)
                  notify(queue.isOpen ? 'Queue closed' : 'Queue opened', 'info')
                }}
              >
                {queue.isOpen ? 'Close queue' : 'Open queue'}
              </Button>
            ) : isMine ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  leaveQueue()
                  notify('You left the queue.', 'info')
                }}
              >
                Leave queue
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleJoin}
                disabled={!queue.isOpen || Boolean(activeTicket)}
                rightIcon={<IconArrowRight className="h-4 w-4" />}
              >
                Join queue
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox label="In line" value={waiting.length} icon={<IconUsers className="h-4 w-4" />} />
        <StatBox label="Capacity" value={queue.capacity} icon={<IconQueue className="h-4 w-4" />} />
        <StatBox label="Avg service" value={`${queue.avgServiceMinutes} min`} icon={<IconClock className="h-4 w-4" />} />
        <StatBox
          label={isMine ? 'Your wait' : 'Longest wait'}
          value={isMine ? formatWait(eta) : formatWait(waitMinutes(waiting.length, queue.avgServiceMinutes))}
          icon={<IconCheckCircle className="h-4 w-4" />}
          highlight={isMine}
        />
      </div>

      {isMine ? (
        <Card className="border-brand-200 bg-linear-to-r from-brand-50 to-violet-50 p-5 dark:border-brand-500/25 dark:from-brand-500/10 dark:to-violet-500/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                You are in this queue
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-slate-900 dark:text-white">
                Position #{position} · about {formatWait(eta)} left
              </p>
            </div>
            <div className="w-full sm:max-w-xs">
              <div className="mb-1.5 flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>Progress</span>
                <span>
                  {position} of {waiting.length}
                </span>
              </div>
              <Progress value={Math.max(1, waiting.length - position + 1)} max={Math.max(1, waiting.length)} />
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Live line"
            description={`${waiting.length} waiting · updates as people are served`}
            action={
              isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    callNext(queue.id)
                    notify(waiting[0] ? `${waiting[0].name} was called.` : 'No one is waiting.', waiting[0] ? 'success' : 'info')
                  }}
                  disabled={!waiting.length}
                >
                  Call next
                </Button>
              ) : (
                <Badge tone="success" dot>
                  Live
                </Badge>
              )
            }
          />

          <div className="mt-4">
            {waiting.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={<IconCheckCircle className="h-5 w-5" />}
                  title="The line is empty"
                  description="Nobody is waiting right now."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {waiting.map((entry, index) => (
                  <li key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold',
                        index === 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      {index + 1}
                    </span>
                    <Avatar name={entry.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-slate-900 dark:text-white">
                        {entry.name}
                        {activeTicket?.entryId === entry.id ? (
                          <span className="ml-2 text-[11px] font-semibold text-brand-600 dark:text-brand-400">You</span>
                        ) : null}
                      </p>
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                        Joined {formatTime(entry.joinedAt)} · {timeAgo(entry.joinedAt)}
                      </p>
                    </div>
                    {index === 0 ? (
                      <Badge tone="success" className="hidden sm:inline-flex">
                        Next up
                      </Badge>
                    ) : null}
                    {isAdmin ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Skip ${entry.name}`}
                          onClick={() => {
                            skipEntry(queue.id, entry.id)
                            notify(`${entry.name} was skipped.`, 'info')
                          }}
                        >
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Serve ${entry.name}`}
                          onClick={() => {
                            serveEntry(queue.id, entry.id)
                            notify(`${entry.name} was called.`)
                          }}
                        >
                          Serve
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Queue details" />
            <CardBody className="space-y-3 pt-4 text-[13px]">
              <DetailRow label="Cohort" value={cohort?.name ?? '—'} />
              <DetailRow label="Capacity" value={`${queue.capacity} people`} />
              <DetailRow label="Avg service" value={`${queue.avgServiceMinutes} minutes`} />
              <DetailRow label="Created" value={new Date(queue.createdAt).toLocaleDateString()} />
              <DetailRow label="Status" value={queue.isOpen ? 'Accepting entries' : 'Closed'} />
              <div>
                <div className="mb-1.5 flex justify-between text-[11.5px] text-slate-500 dark:text-slate-400">
                  <span>Capacity used</span>
                  <span>{Math.round((waiting.length / Math.max(1, queue.capacity)) * 100)}%</span>
                </div>
                <Progress value={waiting.length} max={queue.capacity} />
              </div>
            </CardBody>
          </Card>

          {isAdmin ? (
            <Card>
              <CardHeader title="Admin actions" description="Manage this line." />
              <CardBody className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => callNext(queue.id)}
                  disabled={!waiting.length}
                >
                  Call next person
                </Button>
                <Button
                  className="w-full"
                  variant={queue.isOpen ? 'danger' : 'success'}
                  onClick={() => {
                    toggleQueue(queue.id)
                    notify(queue.isOpen ? 'Queue closed' : 'Queue opened', 'info')
                  }}
                >
                  {queue.isOpen ? 'Close queue' : 'Reopen queue'}
                </Button>
                <Button className="w-full" variant="ghost" onClick={() => navigate('/app/admin')}>
                  Open admin console
                </Button>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="How it works" />
              <CardBody className="space-y-3 pt-4">
                {[
                  'Join the line and keep this page open.',
                  'Your position updates as people ahead are served.',
                  'We notify you when you are close to the front.',
                ].map((text, index) => (
                  <div key={text} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      {index + 1}
                    </span>
                    <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {history.length ? (
            <Card>
              <CardHeader title="Recently served" description={`${history.length} completed`} />
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {history.slice(-5).reverse().map((entry) => (
                  <li key={entry.id} className="flex items-center gap-2.5 px-5 py-2.5">
                    <Avatar name={entry.name} size="xs" />
                    <span className="flex-1 truncate text-[12.5px] text-slate-600 dark:text-slate-400">
                      {entry.name}
                    </span>
                    <Badge tone={entry.status === 'SERVED' ? 'success' : 'warning'}>
                      {entry.status === 'SERVED' ? 'Served' : 'Skipped'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card className={cn('p-4', highlight && 'border-brand-300 ring-1 ring-brand-200 dark:border-brand-500/40 dark:ring-brand-500/20')}>
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
        {icon}
        <p className="text-[11px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )
}
