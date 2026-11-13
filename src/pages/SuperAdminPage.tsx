import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Progress,
  StatTile,
} from '../components/ui'
import {
  IconActivity,
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconLayers,
  IconQueue,
  IconShield,
  IconSparkles,
  IconUsers,
} from '../components/icons'
import { cn, formatDate, timeAgo } from '../lib/utils'
import { useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'

const ADMINS = [
  { name: 'Zainab Musa', email: 'super@qin.app', role: 'Super admin', active: '14m ago' },
  { name: 'Tunde Bello', email: 'admin@qin.app', role: 'Admin', active: '4m ago' },
  { name: 'Ibrahim Sule', email: 'ibrahim@qin.app', role: 'Admin', active: '58m ago' },
  { name: 'Chiamaka Obi', email: 'chiamaka@qin.app', role: 'Admin', active: '1d ago' },
]

const HEALTH = [
  { label: 'API', value: '42 ms', status: 'healthy' as const },
  { label: 'Realtime (WS)', value: '318 sockets', status: 'healthy' as const },
  { label: 'Webhook delivery', value: '99.6%', status: 'healthy' as const },
  { label: 'Background jobs', value: '2 retrying', status: 'warning' as const },
]

export function SuperAdminPage() {
  const cohorts = useQueueStore((state) => state.cohorts)
  const queues = useQueueStore((state) => state.queues)
  const resetDemoData = useQueueStore((state) => state.resetDemoData)
  const notify = useUiStore((state) => state.notify)

  const members = cohorts.reduce((sum, cohort) => sum + cohort.memberCount, 0)
  const waiting = queues.reduce(
    (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'WAITING').length,
    0,
  )
  const served = queues.reduce(
    (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'SERVED').length,
    0,
  )

  const counts = cohorts.map((cohort) => ({
    cohort,
    waiting: queues
      .filter((queue) => queue.cohortId === cohort.id)
      .reduce(
        (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'WAITING').length,
        0,
      ),
  }))
  const maxWaiting = Math.max(1, ...counts.map((item) => item.waiting))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super admin"
        title="Platform overview"
        description="Everything happening across Q-In at a glance."
        actions={
          <Badge tone="violet" dot>
            Full access
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Members" value={members.toLocaleString()} icon={IconUsers} tone="brand" hint={`${cohorts.length} cohorts`} />
        <StatTile label="Queues" value={queues.length} icon={IconQueue} tone="violet" hint={`${queues.filter((queue) => queue.isOpen).length} open now`} />
        <StatTile label="Waiting" value={waiting} icon={IconClock} tone="warning" hint="right now" />
        <StatTile label="Served" value={served} icon={IconCheckCircle} tone="success" hint="completed entries" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Queue load by cohort"
            description="Where people are waiting the most."
            action={<Badge tone="brand">{waiting} total</Badge>}
          />
          <CardBody className="space-y-4 pt-4">
            {counts.map(({ cohort, waiting: cohortWaiting }) => (
              <div key={cohort.id} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-[12.5px] font-medium text-slate-600 sm:w-36 dark:text-slate-300">
                  {cohort.name}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-brand-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${(cohortWaiting / maxWaiting) * 100}%` }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  {cohortWaiting}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="System health" description="Last 24 hours." />
          <CardBody className="space-y-3 pt-4">
            {HEALTH.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      item.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500',
                    )}
                  />
                  <span className="text-[12.5px] text-slate-600 dark:text-slate-300">{item.label}</span>
                </div>
                <span
                  className={cn(
                    'text-[12px] font-semibold',
                    item.status === 'healthy'
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Admin activity"
            description="Who has been active recently."
            action={
              <Link to="/app/admin">
                <Button size="sm" variant="outline" rightIcon={<IconArrowRight className="h-3.5 w-3.5" />}>
                  Manage
                </Button>
              </Link>
            }
          />
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {ADMINS.map((admin) => (
              <li key={admin.email} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={admin.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-900 dark:text-white">{admin.name}</p>
                  <p className="truncate text-[11.5px] text-slate-500 dark:text-slate-400">{admin.email}</p>
                </div>
                <Badge tone={admin.role === 'Super admin' ? 'violet' : 'brand'}>{admin.role}</Badge>
                <span className="hidden w-16 text-right text-[11.5px] text-slate-400 sm:block dark:text-slate-500">
                  {admin.active}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Role distribution" />
            <CardBody className="pt-4">
              <div className="flex h-2.5 overflow-hidden rounded-full">
                <div className="bg-brand-500" style={{ width: '88%' }} />
                <div className="bg-violet-500" style={{ width: '9%' }} />
                <div className="bg-amber-500" style={{ width: '3%' }} />
              </div>
              <div className="mt-4 space-y-2.5">
                <RoleRow color="bg-brand-500" label="Members" value={members} />
                <RoleRow color="bg-violet-500" label="Admins" value={ADMINS.length - 1} />
                <RoleRow color="bg-amber-500" label="Super admins" value={1} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Workspace" />
            <CardBody className="space-y-3 pt-4 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Created</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(cohorts[cohorts.length - 1]?.createdAt ?? new Date().toISOString())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plan</span>
                <Badge tone="brand">Demo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Last activity</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {timeAgo(queues[0]?.createdAt ?? new Date().toISOString())}
                </span>
              </div>
              <div className="pt-1">
                <div className="mb-1.5 flex justify-between text-[11px] text-slate-400">
                  <span>Storage</span>
                  <span>18%</span>
                </div>
                <Progress value={18} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="border-rose-200 dark:border-rose-500/25">
        <CardHeader
          title="Danger zone"
          description="These actions affect the whole demo workspace."
          action={<IconShield className="h-5 w-5 text-rose-500" />}
        />
        <CardBody className="flex flex-col items-start justify-between gap-3 pt-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[13px] font-medium text-slate-900 dark:text-white">Reset demo data</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Restores every cohort, queue and entry to the original seed.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<IconLayers className="h-3.5 w-3.5" />}
            onClick={() => {
              resetDemoData()
              notify('Demo data reset to its original state', 'info')
            }}
          >
            Reset data
          </Button>
        </CardBody>
      </Card>

      <div className="flex items-center gap-2 text-[11.5px] text-slate-400 dark:text-slate-500">
        <IconSparkles className="h-4 w-4" />
        You have full access to every cohort, queue and admin tool.
        <IconActivity className="ml-auto h-4 w-4" />
      </div>
    </div>
  )
}

function RoleRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <span className={cn('h-2 w-2 rounded-full', color)} />
        {label}
      </span>
      <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )
}
