import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Toggle,
} from '../components/ui'
import { IconCamera, IconLayers, IconLogout, IconMoon, IconSun } from '../components/icons'
import { cn, roleLabel } from '../lib/utils'
import { loadJSON, saveJSON } from '../lib/persist'
import { useAuthStore } from '../stores/auth'
import { useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'
import { uploadProfilePicture, setCachedProfilePictureUrl } from '../lib/api'

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const setProfilePicture = useAuthStore((state) => state.setProfilePicture)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const notify = useUiStore((state) => state.notify)
  const resetDemoData = useQueueStore((state) => state.resetDemoData)
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [uploading, setUploading] = useState(false)
  const [prefs, setPrefs] = useState(() =>
    loadJSON('qin:prefs', { queue: true, summary: true, admin: false }),
  )

  const setPref = (key: 'queue' | 'summary' | 'admin', value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    saveJSON('qin:prefs', next)
  }

  const onPickPhoto = async (file: File | undefined) => {
    if (!file || !user) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      notify('Use a JPEG, PNG, or WebP image.', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('Image must be 5 MB or smaller.', 'error')
      return
    }
    const previous = user.profilePictureUrl ?? user.avatar ?? null
    const preview = URL.createObjectURL(file)
    setProfilePicture(preview)
    setUploading(true)
    try {
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('read failed'))
        reader.readAsDataURL(file)
      })
      const url = await uploadProfilePicture(user.id, dataUrl)
      if (url) {
        setCachedProfilePictureUrl(user.id, url)
        setProfilePicture(url)
      } else {
        setProfilePicture(previous)
      }
      notify('Profile picture updated')
    } catch (error) {
      setProfilePicture(previous)
      notify(error instanceof Error ? error.message : 'Upload failed, try later', 'error')
    } finally {
      setUploading(false)
      URL.revokeObjectURL(preview)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance and notifications."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Profile" description="This is how you appear to your cohorts." />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar name={name || 'Guest'} src={user?.profilePictureUrl ?? user?.avatar} size="lg" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm ring-2 ring-white transition-colors hover:bg-brand-700 disabled:opacity-60 dark:ring-slate-900"
                    aria-label="Update profile picture"
                    title="Update profile picture"
                  >
                    <IconCamera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void onPickPhoto(e.target.files?.[0])}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-900 dark:text-white">{name || 'Guest'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone={user?.role === 'SUPER_ADMIN' ? 'violet' : user?.role === 'ADMIN' ? 'brand' : 'neutral'}>
                      {roleLabel(user?.role ?? 'NATIVE')}
                    </Badge>
                    {user?.emailVerified ? <Badge tone="success" dot>Verified</Badge> : null}
                  </div>
                  <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
                    {uploading ? 'Uploading photo…' : 'Click the camera icon to update your photo.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  name="settings-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Input
                  label="Email address"
                  name="settings-email"
                  value={user?.email ?? ''}
                  disabled
                  hint="Contact an admin to change your email."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    updateProfile({ name: name.trim() })
                    notify('Profile saved')
                  }}
                  disabled={name.trim().length < 2}
                >
                  Save changes
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notifications" description="Choose what shows up in your inbox." />
            <CardBody className="space-y-1 pt-2">
              <PreferenceRow
                title="Queue updates"
                description="Position changes and when you are close to the front."
                checked={prefs.queue}
                onChange={(next) => setPref('queue', next)}
              />
              <PreferenceRow
                title="Weekly summary"
                description="A digest of how your cohorts performed."
                checked={prefs.summary}
                onChange={(next) => setPref('summary', next)}
              />
              <PreferenceRow
                title="Admin alerts"
                description="Queue closures, suspensions and platform changes."
                checked={prefs.admin}
                onChange={(next) => setPref('admin', next)}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Appearance" description="Pick a theme for this device." />
            <CardBody className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as const).map((option) => {
                const active = theme === option
                const Icon = option === 'dark' ? IconMoon : IconSun
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors',
                      active
                        ? 'border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-300 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/30'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[13px] font-medium capitalize">{option}</span>
                    <span className="text-[11px] opacity-70">
                      {option === 'light' ? 'Bright and crisp' : 'Easy on the eyes'}
                    </span>
                  </button>
                )
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account" />
            <CardBody className="space-y-2 pt-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                leftIcon={<IconLogout className="h-4 w-4" />}
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                Sign out
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 dark:text-slate-300"
                leftIcon={<IconLayers className="h-4 w-4" />}
                onClick={() => {
                  resetDemoData()
                  notify('Demo data reset', 'info')
                }}
              >
                Reset demo data
              </Button>
            </CardBody>
          </Card>

          <Card className="bg-slate-900 p-5 text-white dark:bg-slate-900">
            <p className="font-display text-[14px] font-semibold">Workspace</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">
              Connected to backend via <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">VITE_API_URL</code>.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PreferenceRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0 dark:border-slate-800">
      <div>
        <p className="text-[13px] font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  )
}
