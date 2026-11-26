import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  Select,
  StatTile,
  Toggle,
} from '../components/ui'
import {
  IconActivity,
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconEdit,
  IconPause,
  IconPlay,
  IconPlus,
  IconQueue,
  IconShield,
  IconTrash,
  IconUsers,
  IconWebhook,
} from '../components/icons'
import type { AdminRecord, Role, WebhookRecord } from '../lib/types'
import { cn, formatDate, timeAgo } from '../lib/utils'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'
import { webhooksApi, superAdminApi } from '../api'

type TabId = 'queues' | 'admins' | 'webhooks'

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'queues', label: 'Queues', icon: <IconQueue className="h-4 w-4" /> },
  { id: 'admins', label: 'Admins', icon: <IconShield className="h-4 w-4" /> },
  { id: 'webhooks', label: 'Webhooks', icon: <IconWebhook className="h-4 w-4" /> },
]

export function AdminPage() {
  const [tab, setTab] = useState<TabId>('queues')
  const queues = useQueueStore((state) => state.queues)
  const hydrateFromBackend = useQueueStore((state) => state.hydrateFromBackend)
  const cohorts = useQueueStore((state) => state.cohorts)
  const toggleQueue = useQueueStore((state) => state.toggleQueue)
  const closeQueue = useQueueStore((state) => state.closeQueue)
  const updateQueueCapacity = useQueueStore((state) => state.updateQueueCapacity)
  const deleteQueue = useQueueStore((state) => state.deleteQueue)
  const notify = useUiStore((state) => state.notify)
  const currentUser = useAuthStore((state) => state.user)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const [admins, setAdmins] = useState<AdminRecord[]>([])
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([])
  const [webhooksLoading, setWebhooksLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState<{ email: string; role: Role }>({ email: '', role: 'ADMIN' })
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [webhookForm, setWebhookForm] = useState({ endpoint: '', events: ['queue.opened'] })
  const [capacityOpen, setCapacityOpen] = useState(false)
  const [capacityQueue, setCapacityQueue] = useState<{ id: string; name: string; capacity: number } | null>(null)
  const [capacityValue, setCapacityValue] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteQueueId, setDeleteQueueId] = useState<string | null>(null)

  useEffect(() => { void hydrateFromBackend() }, [hydrateFromBackend])

  useEffect(() => {
    webhooksApi.getAll()
      .then(data => {
        setWebhooks(data.map(w => ({
          id: w.id,
          endpoint: w.url,
          events: w.events,
          active: w.active,
          deliveries: 0,
          failures: 0,
          createdAt: w.createdAt,
        })))
      })
      .catch(() => {})
      .finally(() => setWebhooksLoading(false))
  }, [])

  const waiting = queues.reduce(
    (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'WAITING').length,
    0,
  )
  const served = queues.reduce(
    (sum, queue) => sum + queue.entries.filter((entry) => entry.status === 'SERVED').length,
    0,
  )

  const submitInvite = (event: React.FormEvent) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) {
      setInviteError('Enter a valid email address.')
      return
    }
    const name = invite.email.split('@')[0].replace(/[._-]/g, ' ')
    setAdmins((current) => [
      {
        id: `adm_${Date.now()}`,
        name: name.replace(/\b\w/g, (char) => char.toUpperCase()),
        email: invite.email.toLowerCase(),
        role: invite.role,
        status: 'ACTIVE',
        lastActive: new Date().toISOString(),
      },
      ...current,
    ])
    notify('Admin invitation sent')
    setInviteOpen(false)
    setInvite({ email: '', role: 'ADMIN' })
    setInviteError(null)
  }

  const submitWebhook = (event: React.FormEvent) => {
    event.preventDefault()
    if (!/^https?:\/\/.+/.test(webhookForm.endpoint)) {
      notify('Enter a valid https endpoint.', 'error')
      return
    }
    setWebhooks((current) => [
      {
        id: `wh_${Date.now()}`,
        endpoint: webhookForm.endpoint,
        events: webhookForm.events,
        active: true,
        deliveries: 0,
        failures: 0,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    notify('Webhook added')
    setWebhookOpen(false)
    setWebhookForm({ endpoint: '', events: ['queue.opened'] })
  }

  const openCapacityModal = (queue: { id: string; name: string; capacity: number }) => {
    setCapacityQueue(queue)
    setCapacityValue(String(queue.capacity))
    setCapacityOpen(true)
  }

  const submitCapacity = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!capacityQueue) return
    const newCapacity = Math.max(1, Number(capacityValue) || 1)
    try {
      await updateQueueCapacity(capacityQueue.id, newCapacity)
      notify(`Capacity updated to ${newCapacity}`)
    } catch (error) {
      notify('Failed to update capacity', 'error')
    }
    setCapacityOpen(false)
    setCapacityQueue(null)
    setCapacityValue('')
  }

  const openDeleteModal = (queueId: string) => {
    setDeleteQueueId(queueId)
    setDeleteOpen(true)
  }

  const submitDelete = async () => {
    if (!deleteQueueId) return
    try {
      await deleteQueue(deleteQueueId)
      notify('Queue deleted')
    } catch (error) {
      notify('Failed to delete queue', 'error')
    }
    setDeleteOpen(false)
    setDeleteQueueId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manage"
        title="Admin console"
        description="Keep queues healthy, manage admins and wire up event delivery."
        actions={
          <Badge tone="violet" dot>
            {admins.filter((admin) => admin.status === 'ACTIVE').length} active admins
          </Badge>
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              tab === item.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'queues' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Open queues"
              value={queues.filter((queue) => queue.isOpen).length}
              icon={IconPlay}
              tone="success"
              hint={`${queues.length} total queues`}
            />
            <StatTile label="People waiting" value={waiting} icon={IconUsers} tone="brand" hint="across all cohorts" />
            <StatTile label="Served today" value={served} icon={IconCheckCircle} tone="violet" hint="completed entries" />
            <StatTile
              label="Avg service"
              value={`${Math.round(queues.reduce((sum, queue) => sum + queue.avgServiceMinutes, 0) / Math.max(1, queues.length))}m`}
              icon={IconClock}
              tone="warning"
              hint="per person"
            />
          </div>

          <Card>
            <CardHeader
              title="All queues"
              description="Open or close a line instantly."
              action={
                <Link to="/app/queues">
                  <Button size="sm" variant="outline" rightIcon={<IconArrowRight className="h-3.5 w-3.5" />}>
                    Manage
                  </Button>
                </Link>
              }
            />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/80 text-[10.5px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="px-5 py-2.5 font-semibold">Queue</th>
                    <th className="px-3 py-2.5 font-semibold">Cohort</th>
                    <th className="px-3 py-2.5 font-semibold">Waiting</th>
                    <th className="px-3 py-2.5 font-semibold">Avg</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {queues.map((queue) => {
                    const count = queue.entries.filter((entry) => entry.status === 'WAITING').length
                    return (
                      <tr key={queue.id} className="text-[13px] hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <Link
                            to={`/app/queues/${queue.id}`}
                            className="font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                          >
                            {queue.name}
                          </Link>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {queue.capacity} capacity{queue.queueDate ? ` · ${queue.queueDate}` : ''}{queue.recurring ? ' · Recurring daily' : ''}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                          {cohorts.find((cohort) => cohort.id === queue.cohortId)?.name ?? '—'}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">{count}</td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{queue.avgServiceMinutes}m</td>
                        <td className="px-3 py-3">
                          <Badge tone={queue.isOpen ? 'success' : 'neutral'} dot>
                            {queue.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<IconEdit className="h-3.5 w-3.5" />}
                              onClick={() => openCapacityModal({ id: queue.id, name: queue.name, capacity: queue.capacity })}
                              aria-label={`Edit capacity for ${queue.name}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={queue.isOpen ? <IconPause className="h-3.5 w-3.5" /> : <IconPlay className="h-3.5 w-3.5" />}
                              onClick={() => {
                                if (queue.isOpen) void closeQueue(queue.id)
                                else void toggleQueue(queue.id)
                                notify(queue.isOpen ? `${queue.name} closed` : `${queue.name} opened`, 'info')
                              }}
                            >
                              {queue.isOpen ? 'Close' : 'Open'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              leftIcon={<IconTrash className="h-3.5 w-3.5" />}
                              onClick={() => openDeleteModal(queue.id)}
                              aria-label={`Delete ${queue.name}`}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'admins' && isSuperAdmin ? (
        <Card>
          <CardHeader
            title="Admin management"
            description="Promote, suspend or remove admins."
            action={
              <Button size="sm" leftIcon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setInviteOpen(true)}>
                Invite admin
              </Button>
            }
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/80 text-[10.5px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-semibold">Admin</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Last active</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                      No admins found. Invite an admin to get started.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                      <tr key={admin.id} className="text-[13px] hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={admin.name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-white">{admin.name}</p>
                              <p className="truncate text-[11.5px] text-slate-500 dark:text-slate-400">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={admin.role === 'SUPER_ADMIN' ? 'violet' : 'brand'}>
                            {admin.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={admin.status === 'ACTIVE' ? 'success' : 'warning'} dot>
                            {admin.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{timeAgo(admin.lastActive)}</td>
                        <td className="px-5 py-3">
                          {isSuperAdmin ? (
                            <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await superAdminApi.suspendAdmin(admin.id)
                                  setAdmins((current) =>
                                    current.map((item) =>
                                      item.id === admin.id
                                        ? { ...item, status: item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
                                        : item,
                                    ),
                                  )
                                  notify(
                                    admin.status === 'ACTIVE' ? `${admin.name} suspended` : `${admin.name} reactivated`,
                                    'info',
                                  )
                                } catch {
                                  notify('Failed to update admin status', 'error')
                                }
                              }}
                            >
                              {admin.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                              aria-label={`Remove ${admin.name}`}
                              onClick={async () => {
                                try {
                                  await superAdminApi.deleteAdmin(admin.id)
                                  setAdmins((current) => current.filter((item) => item.id !== admin.id))
                                  notify(`${admin.name} removed`, 'info')
                                } catch {
                                  notify('Failed to delete admin', 'error')
                                }
                              }}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                            </div>
                          ) : (
                            <span className="text-[11.5px] text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
</tbody>
              </table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Admin management" description="Restricted to Super Admins." />
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            Admin management is restricted to Super Admins.
          </div>
        </Card>
      )}

      {tab === 'webhooks' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Webhooks"
              description="Send queue events to your own systems."
              action={
                <Button size="sm" leftIcon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setWebhookOpen(true)}>
                  Add webhook
                </Button>
              }
            />
          </Card>

          {webhooksLoading ? (
            <Card>
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <span className="ml-3 text-slate-500 dark:text-slate-400">Loading webhooks...</span>
              </div>
            </Card>
          ) : webhooks.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconWebhook className="h-5 w-5" />}
                title="No webhooks yet"
                description="Add an endpoint to start receiving queue events."
              />
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {webhooks.map((webhook) => (
                <Card key={webhook.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[12.5px] font-medium text-slate-900 dark:text-white">
                        {webhook.endpoint}
                      </p>
                      <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">
                        Added {formatDate(webhook.createdAt)}
                      </p>
                    </div>
                    <Toggle
                      checked={webhook.active}
                      label="Toggle webhook"
                      onChange={(next) => {
                        setWebhooks((current) =>
                          current.map((item) => (item.id === webhook.id ? { ...item, active: next } : item)),
                        )
                        notify(next ? 'Webhook enabled' : 'Webhook disabled', 'info')
                      }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {event}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Deliveries</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                        {webhook.deliveries.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Failures</p>
                      <p
                        className={cn(
                          'mt-0.5 text-[13px] font-semibold',
                          webhook.failures > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {webhook.failures}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge tone={webhook.active ? 'success' : 'neutral'} dot>
                      {webhook.active ? 'Active' : 'Paused'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<IconActivity className="h-3.5 w-3.5" />}
                        onClick={() => {
                          setWebhooks((current) =>
                            current.map((item) =>
                              item.id === webhook.id ? { ...item, deliveries: item.deliveries + 1 } : item,
                            ),
                          )
                          notify('Test event delivered')
                        }}
                      >
                        Send test
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        aria-label="Delete webhook"
                        onClick={() => {
                          setWebhooks((current) => current.filter((item) => item.id !== webhook.id))
                          notify('Webhook removed', 'info')
                        }}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite an admin"
        description="They will get an email with a secure sign-up link."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitInvite}>Send invite</Button>
          </>
        }
      >
        <form onSubmit={submitInvite} className="space-y-4">
          <Input
            label="Email address"
            name="invite-email"
            type="email"
            placeholder="colleague@example.com"
            value={invite.email}
            onChange={(event) => setInvite({ ...invite, email: event.target.value })}
          />
          <Select
            label="Role"
            name="invite-role"
            value={invite.role}
            onChange={(event) => setInvite({ ...invite, role: event.target.value as Role })}
          >
            <option value="ADMIN">Admin</option>
            {isSuperAdmin ? <option value="SUPER_ADMIN">Super admin</option> : null}
          </Select>
          {inviteError ? (
            <p className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{inviteError}</p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={webhookOpen}
        onClose={() => setWebhookOpen(false)}
        title="Add a webhook"
        description="We will POST a JSON payload to this endpoint."
        footer={
          <>
            <Button variant="ghost" onClick={() => setWebhookOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitWebhook}>Add webhook</Button>
          </>
        }
      >
        <form onSubmit={submitWebhook} className="space-y-4">
          <Input
            label="Endpoint URL"
            name="webhook-endpoint"
            placeholder="https://example.com/hooks/qin"
            value={webhookForm.endpoint}
            onChange={(event) => setWebhookForm({ ...webhookForm, endpoint: event.target.value })}
          />
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300">Events</p>
            <div className="grid grid-cols-2 gap-2">
              {['queue.opened', 'queue.closed', 'entry.joined', 'entry.called', 'entry.served', 'entry.skipped'].map(
                (event) => {
                  const checked = webhookForm.events.includes(event)
                  return (
                    <label
                      key={event}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 font-mono text-[11px] transition-colors',
                        checked
                          ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event_) =>
                          setWebhookForm((current) => ({
                            ...current,
                            events: event_.target.checked
                              ? [...current.events, event]
                              : current.events.filter((item) => item !== event),
                          }))
                        }
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                      />
                      {event}
                    </label>
                  )
                },
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={capacityOpen}
        onClose={() => { setCapacityOpen(false); setCapacityQueue(null); setCapacityValue(''); }}
        title="Update queue capacity"
        description="Set the maximum number of people allowed in this queue."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCapacityOpen(false); setCapacityQueue(null); setCapacityValue(''); }}>
              Cancel
            </Button>
            <Button onClick={submitCapacity}>Save capacity</Button>
          </>
        }
      >
        <form onSubmit={submitCapacity} className="space-y-4">
          <Input
            label="Capacity"
            name="queue-capacity"
            type="number"
            min="1"
            placeholder="20"
            value={capacityValue}
            onChange={(event) => setCapacityValue(event.target.value)}
            required
          />
          {capacityQueue && (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Current capacity: <span className="font-medium">{capacityQueue.capacity}</span>
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteQueueId(null); }}
        title="Delete queue"
        description="This action cannot be undone. All queue data will be permanently removed."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDeleteOpen(false); setDeleteQueueId(null); }}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitDelete}>Delete queue</Button>
          </>
        }
      >
        <p className="text-slate-600 dark:text-slate-400">
          Are you sure you want to delete this queue? This will remove all entries and cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
