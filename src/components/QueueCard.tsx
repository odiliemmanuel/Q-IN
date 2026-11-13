import { Link } from 'react-router-dom'
import type { Queue } from '../lib/types'
import { cn } from '../lib/utils'
import { Badge, Button, Card, Progress } from './ui'
import { IconClock, IconUsers } from './icons'

export function QueueCard({
  queue,
  cohortName,
  joined = false,
  blocked = false,
  onJoin,
  className,
}: {
  queue: Queue
  cohortName: string
  joined?: boolean
  blocked?: boolean
  onJoin?: (queueId: string) => void
  className?: string
}) {
  const waiting = queue.entries.filter((entry) => entry.status === 'WAITING').length

  return (
    <Card className={cn('flex flex-col p-5 transition-shadow hover:shadow-md', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-[15px] font-semibold text-slate-900 dark:text-white">
              {queue.name}
            </h3>
            {joined ? <Badge tone="brand">Joined</Badge> : null}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">{cohortName}</p>
        </div>
        <Badge tone={queue.isOpen ? 'success' : 'neutral'} dot>
          {queue.isOpen ? 'Open' : 'Closed'}
        </Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
        {queue.description}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        <Metric icon={<IconUsers className="h-3.5 w-3.5" />} label="Waiting" value={waiting} />
        <Metric label="Capacity" value={queue.capacity} />
        <Metric icon={<IconClock className="h-3.5 w-3.5" />} label="Avg wait" value={`${queue.avgServiceMinutes}m`} />
      </div>

      <Progress value={waiting} max={queue.capacity} className="mt-3" tone={queue.isOpen ? 'brand' : 'warning'} />

      <div className="mt-4 flex gap-2">
        <Link to={`/app/queues/${queue.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View queue
          </Button>
        </Link>
        {onJoin ? (
          <Button
            size="sm"
            onClick={() => onJoin(queue.id)}
            disabled={!queue.isOpen || joined || blocked}
            title={blocked && !joined ? 'Leave your current queue first' : undefined}
          >
            {joined ? 'Joined' : 'Join'}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  )
}
