import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { PageHeader } from '../components/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  Progress,
} from '../components/ui'
import {
  IconArrowLeft,
  IconCheckCircle,
  IconClock,
  IconPause,
  IconPlay,
  IconQueue,
  IconUsers,
  IconActivity,
} from '../components/icons'
import { cn, formatTime, formatWait, joinUrl, timeAgo, waitMinutes } from '../lib/utils'
import { useAuthStore } from '../stores/auth'
import {
  joinResultMessage,
  positionOf,
  useQueueStore,
  type JoinResult,
} from '../stores/queue'
import { useUiStore } from '../stores/ui'
import { ServiceTimerDisplay } from '../components/queue/ServiceTimerDisplay'
import { fetchTotpCode } from '../lib/api'

export function QueueDetailPage() {
  const { queueId } = useParams<{ queueId: string }>()
  const navigate = useNavigate()
  const queues = useQueueStore((state) => state.queues)
  const cohorts = useQueueStore((state) => state.cohorts)
  const activeTicket = useQueueStore((state) => state.activeTicket)
  const leaveQueue = useQueueStore((state) => state.leaveQueue)
  const callNext = useQueueStore((state) => state.callNext)
  const serveEntry = useQueueStore((state) => state.serveEntry)
  const skipEntry = useQueueStore((state) => state.skipEntry)
  const toggleQueue = useQueueStore((state) => state.toggleQueue)
  const user = useAuthStore((state) => state.user)
  const notify = useUiStore((state) => state.notify)

  const goBack = () => navigate(-1)

  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState<string>('')
  const [expiresIn, setExpiresIn] = useState<number>(0)
  const [gateCode, setGateCode] = useState('')
  const [gateError, setGateError] = useState<string | null>(null)
  const [gateBusy, setGateBusy] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const queue = queues.find((item) => item.id === queueId)

  if (!queue) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to queues
        </button>
        <Card>
          <EmptyState
            icon={<IconQueue className="h-5 w-5" />}
            title="Queue not found"
            description="This queue may have been removed or the link is incorrect."
            action={
              <button type="button" onClick={goBack} className="text-[13px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Browse queues
              </button>
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
  const hasServiceTimer = queue.serviceTimeMinutes && queue.serviceTimeMinutes > 0

  // Only admins and people who have already joined (via code or QR) can see
  // who is on the line — members must join first.
  const canViewLine = isAdmin || isMine

  // TOTP code refresh function
  const refreshTotpCode = async () => {
    if (!queue) return
    try {
      const data = await fetchTotpCode(queue.id)
      setTotpCode(data.code)
      setExpiresIn(data.expiresIn)
    } catch (error) {
      console.error('Failed to fetch TOTP code:', error)
    }
  }

  // Countdown and auto-refresh
  useEffect(() => {
    if (!showQr) return
    const interval = setInterval(() => {
      setExpiresIn(prev => {
        const next = prev - 1
        if (next <= 0) {
          refreshTotpCode()
        }
        return Math.max(0, next)
      })
    }, 1000)
    countdownRef.current = interval
    return () => clearInterval(interval)
  }, [showQr])

  // Initial fetch when QR modal opens
  const openQr = async () => {
    setShowQr(true)
    await refreshTotpCode()
    if (totpCode) {
      const url = await QRCode.toDataURL(joinUrl(totpCode), {
        width: 320,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      setQrDataUrl(url)
    }
  }

  const joinWithGateCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setGateError(null)
    setGateBusy(true)
    try {
      const result: JoinResult = await useQueueStore
        .getState()
        .joinByCode(gateCode, user?.name ?? 'You', user?.profilePictureUrl ?? user?.avatar, queue.id)
      if (result === 'joined') {
        notify(joinResultMessage(result), 'success')
        return
      }
      if (result === 'already-in-queue') {
        notify('You are already in another queue.', 'info')
        return
      }
      setGateError(useQueueStore.getState().lastJoinError ?? joinResultMessage(result))
    } finally {
      setGateBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <IconArrowLeft className="h-4 w-4" />
        Back to queues
      </button>

      <PageHeader
        eyebrow={queue.queueDate ? `${queue.queueDate}${queue.recurring ? ' · Recurring daily' : ''}` : cohort?.name}
        title={queue.name}
        description={queue.description}
        actions={
          <>
            <Badge tone={queue.isOpen ? 'success' : 'neutral'} dot>
              {queue.isOpen ? 'Open' : 'Closed'}
            </Badge>
            {isAdmin ? (
              <>
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
                <Button variant="outline" size="sm" onClick={() => void openQr()}>
                  Show entry QR
                </Button>
              </>
            ) : isMine ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await leaveQueue()
                  if (!useQueueStore.getState().activeTicket) notify('You left the queue.', 'info')
                }}
              >
                Leave queue
              </Button>
            ) : null}
          </>
        }
      />

      {canViewLine ? (
        <>
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

          {isMine && hasServiceTimer && (
            <Card className="border-brand-200 bg-linear-to-r from-brand-50 to-violet-50 p-5 dark:border-brand-500/25 dark:from-brand-500/10 dark:to-violet-500/10">
              <ServiceTimerDisplay userId={user?.id ?? ''} queueId={queue.id} />
            </Card>
          )}

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
                  ) : null
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
                        <Avatar name={entry.name} src={entry.avatar} size="sm" />
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
                  {hasServiceTimer && (
                    <>
                      <DetailRow label="Service time" value={`${queue.serviceTimeMinutes} minutes`} />
                      <DetailRow label="Grace period" value={`${queue.gracePeriodMinutes ?? 0} minutes`} />
                    </>
                  )}
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
                    <Button className="w-full" variant="outline" onClick={() => void openQr()}>
                      Show entry QR
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
                        <Avatar name={entry.name} src={entry.avatar} size="xs" />
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
        </>
      ) : (
        <Card className="p-6">
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/25">
              <IconQueue className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-white">
              This queue is private until you join
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Enter the code given by the queue admin (or scan their QR poster) to see who is in
              line and take your position.
            </p>
            <form onSubmit={joinWithGateCode} className="mx-auto mt-5 flex max-w-sm flex-col gap-2.5 sm:flex-row">
              <div className="flex-1 text-left">
                <Input
                  name="code"
                  placeholder="e.g. LAB-2048"
                  value={gateCode}
                  onChange={(event) => setGateCode(event.target.value)}
                  aria-label="Queue code"
                  required
                />
              </div>
              <Button type="submit" loading={gateBusy}>Join queue</Button>
            </form>
            {gateError ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {gateError}
              </p>
            ) : null}
          </div>
        </Card>
      )}

      <Modal
        open={showQr}
        onClose={() => setShowQr(false)}
        title="Entry QR code"
        description="Members scan this to join the queue — or they can enter the 6-digit code below. Code refreshes every 30 seconds."
      >
        <div className="flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Queue entry QR code" className="rounded-2xl border border-slate-200 dark:border-slate-700" />
          ) : null}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-white">
                {totpCode || 'Loading...'}
              </p>
              {showQr && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-brand-600 dark:text-brand-400">
                  <IconActivity className="h-3.5 w-3.5 animate-spin" />
                  <span>Refreshes in {expiresIn}s</span>
                </span>
              )}
            </div>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">6-digit entry code</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(totpCode).then(() => notify('Code copied', 'success'))} disabled={!totpCode}>
              Copy code
            </Button>
            <Button variant="outline" onClick={refreshTotpCode} disabled={!showQr}>
              <IconActivity className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </Modal>
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