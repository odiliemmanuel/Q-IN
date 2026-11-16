import { useCallback, useEffect, useRef, useState } from 'react'
import { generateAvatar } from '../lib/caricature'
import { Button } from './ui'
import { IconCamera, IconSparkles, IconUser } from './icons'

type Stage = 'camera' | 'review'

/**
 * Capture (camera) or upload (file) a photo, then turn it into an avatar.
 * The result is passed to `onConfirm` as a PNG data URL.
 */
export function FaceCapture({
  onConfirm,
  busy,
}: {
  onConfirm: (avatarDataUrl: string) => void
  busy?: boolean
}) {
  const [stage, setStage] = useState<Stage>('camera')
  const [streamOn, setStreamOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStreamOn(false)
  }, [])

  useEffect(() => () => stopStream(), [stopStream])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setStreamOn(true)
    } catch {
      setCameraError(
        'We could not access your camera. You can upload a photo instead.',
      )
    }
  }, [])

  useEffect(() => {
    if (stage === 'camera' && !streamOn && !cameraError) void startCamera()
  }, [stage, streamOn, cameraError, startCamera])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const side = Math.min(video.videoWidth, video.videoHeight) || 640
    canvas.width = side
    canvas.height = side
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(side, 0)
    ctx.scale(-1, 1) // mirror like a selfie
    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      side,
      side,
    )
    stopStream()
    canvas.toBlob(
      (blob) => {
        if (blob) setSource(URL.createObjectURL(blob))
        setStage('review')
      },
      'image/png',
    )
  }

  const onPickFile = (file: File | undefined) => {
    if (!file) return
    setStage('review')
    setSource((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const generate = async () => {
    if (!source) return
    setWorking(true)
    try {
      const blob = await (await fetch(source)).blob()
      const avatar = await generateAvatar(blob)
      setResult(avatar)
    } catch {
      setCameraError('Something went wrong while creating your avatar. Try another photo.')
    } finally {
      setWorking(false)
    }
  }

  const confirm = () => {
    if (!result) return
    stopStream()
    onConfirm(result)
  }

  const retake = () => {
    setResult(null)
    setSource((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setCameraError(null)
    setStage('camera')
    setStreamOn(false)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onPickFile(event.target.files?.[0])}
      />

      {stage === 'camera' ? (
        <div>
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full scale-x-[-1] object-cover"
            />
            {!streamOn && !cameraError ? (
              <div className="absolute inset-0 grid place-items-center text-xs text-slate-500">
                Starting camera…
              </div>
            ) : null}
            {cameraError ? (
              <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <IconUser className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2">{cameraError}</p>
                </div>
              </div>
            ) : null}
            {/* Face guide ring */}
            <div className="pointer-events-none absolute inset-0 m-auto h-[62%] w-[62%] rounded-full border-2 border-dashed border-white/70 mix-blend-difference" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Button
              onClick={capture}
              disabled={!streamOn}
              leftIcon={<IconCamera className="h-4 w-4" />}
            >
              Take picture
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Upload photo
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
            Your avatar lets others recognise you on the queue.
          </p>
        </div>
      ) : (
        <div>
          <div className="mx-auto grid aspect-square w-full max-w-[280px] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {working ? (
              <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
                <IconSparkles className="h-6 w-6 animate-pulse text-brand-600" />
                Creating your avatar…
              </div>
            ) : result ? (
              <img src={result} alt="Your caricature" className="h-full w-full object-cover" />
            ) : source ? (
              <img src={source} alt="Your photo" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {result ? (
              <>
                <Button onClick={confirm} disabled={busy}>
                  Looks good — use it
                </Button>
                <Button variant="outline" onClick={retake} disabled={busy}>
                  Retake
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={generate}
                  disabled={working || !source}
                  leftIcon={<IconSparkles className="h-4 w-4" />}
                >
                  Generate avatar
                </Button>
                <Button variant="outline" onClick={retake} disabled={working}>
                  Back
                </Button>
                <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={working}>
                  Upload instead
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
