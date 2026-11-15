import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import jsQR from 'jsqr'
import { Button, Input } from '../components/ui'
import { IconCamera, IconQueue, IconSparkles } from '../components/icons'
import { useAuthStore } from '../stores/auth'
import { joinResultMessage, useQueueStore } from '../stores/queue'
import { useUiStore } from '../stores/ui'
import { normalizeJoinCode } from '../lib/utils'
import { Logo } from '../components/Logo'

/** Pull a join code out of a scanned value: a code itself or a /join?code= URL. */
function extractCode(raw: string): string {
  const text = raw.trim()
  try {
    const url = new URL(text)
    const fromQuery = url.searchParams.get('code')
    if (fromQuery) return normalizeJoinCode(fromQuery)
  } catch {
    // Not a URL — treat the text itself as the code.
  }
  return normalizeJoinCode(text)
}

export function JoinPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const notify = useUiStore((state) => state.notify)

  const [tab, setTab] = useState<'code' | 'scan'>('code')
  const [code, setCode] = useState(searchParams.get('code') ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [working, setWorking] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const finish = useCallback(
    (result: Parameters<typeof joinResultMessage>[0]) => {
      if (result === 'joined') {
        const ticket = useQueueStore.getState().activeTicket
        notify('You joined the queue!', 'success')
        navigate(ticket ? `/app/queues/${ticket.queueId}` : '/app/dashboard')
        return
      }
      if (result === 'already-in-queue') {
        const ticket = useQueueStore.getState().activeTicket
        notify('You are already in a queue — taking you there.', 'info')
        navigate(ticket ? `/app/queues/${ticket.queueId}` : '/app/dashboard')
        return
      }
      setStatus(joinResultMessage(result))
    },
    [navigate, notify],
  )

  const joinWith = useCallback(
    async (rawCode: string): Promise<Parameters<typeof joinResultMessage>[0]> => {
      const store = useQueueStore.getState()
      const result = await store.joinByCode(extractCode(rawCode), user?.name ?? 'You', user?.avatar)
      finish(result)
      return result
    },
    [user, finish],
  )

  // Auto-join when arriving from a scanned QR link (/join?code=LAB-2048).
  const urlCode = searchParams.get('code')
  const autoJoinedRef = useRef(false)
  useEffect(() => {
    if (!urlCode || autoJoinedRef.current) return
    autoJoinedRef.current = true
    void (async () => {
      const result = await joinWith(urlCode)
      // On success we navigate away to the queue, so only clean the URL in place
      // when the join failed and the member stays on this page.
      if (result !== 'joined' && result !== 'already-in-queue') {
        setSearchParams({}, { replace: true })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode])

  const stopScan = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  const startScan = useCallback(async () => {
    setCameraError(null)
    setStatus(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setScanning(true)

      const tick = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video && canvas && video.readyState >= 2) {
          const w = video.videoWidth
          const h = video.videoHeight
          if (w && h) {
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(video, 0, 0, w, h)
              const image = ctx.getImageData(0, 0, w, h)
              const found = jsQR(image.data, w, h, { inversionAttempts: 'dontInvert' })
              if (found?.data) {
                stopScan()
                joinWith(found.data)
                return
              }
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setCameraError('We could not access your camera. You can enter the code instead.')
    }
  }, [joinWith, stopScan])

  useEffect(() => () => stopScan(), [stopScan])

  const switchTab = (next: 'code' | 'scan') => {
    stopScan()
    setStatus(null)
    setCameraError(null)
    setTab(next)
    if (next === 'scan') void startScan()
  }

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus(null)
    if (!code.trim()) {
      setStatus('Enter the code shown by the queue admin.')
      return
    }
    setWorking(true)
    try {
      const result = await joinWith(code)
      if (result !== 'joined' && result !== 'already-in-queue') {
        setStatus(useQueueStore.getState().lastJoinError ?? joinResultMessage(result))
      }
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" aria-label="Q-In home" className="inline-block rounded-lg">
          <Logo />
        </Link>
        <Link
          to="/app/dashboard"
          className="text-[13px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Skip to dashboard
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-5 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/25">
            <IconQueue className="h-3.5 w-3.5" />
            Join a queue
          </span>
          <h1 className="mt-3 font-display text-[24px] font-semibold tracking-tight text-slate-900 dark:text-white">
            Scan or enter a code
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            You will see who is on the queue and your position right after joining — not before.
          </p>

          {/* Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                { key: 'code', label: 'Enter code' },
                { key: 'scan', label: 'Scan QR code' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => switchTab(item.key)}
                className={
                  'rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ' +
                  (tab === item.key
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === 'code' ? (
              <form onSubmit={submitCode} className="space-y-3">
                <Input
                  label="Queue code"
                  name="code"
                  placeholder="e.g. LAB-2048"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                />
                <Button type="submit" size="lg" className="w-full" loading={working}>
                  Join queue
                </Button>
              </form>
            ) : (
              <div>
                <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-800">
                  <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  {scanning ? (
                    <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
                  ) : null}
                  {!scanning && !cameraError ? (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs text-slate-300">
                      Starting camera…
                    </div>
                  ) : null}
                  {cameraError ? (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs text-slate-300">
                      <div>
                        <IconCamera className="mx-auto h-8 w-8 text-slate-500" />
                        <p className="mt-2">{cameraError}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex justify-center gap-2">
                  <Button variant="outline" onClick={() => switchTab('code')}>
                    Enter code instead
                  </Button>
                  {scanning ? (
                    <Button variant="ghost" onClick={stopScan}>
                      Stop
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {status ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {status}
            </p>
          ) : null}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px] text-slate-500 dark:text-slate-400">
          <IconSparkles className="h-3.5 w-3.5 text-brand-600" />
          Ask the queue admin for the code or the QR poster.
        </p>
      </main>
    </div>
  )
}
