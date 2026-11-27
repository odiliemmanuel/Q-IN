import { useState, useEffect, useRef, useCallback } from 'react'
import { queueWebSocket, type ServiceTimerEvent, type ServiceTimerStatus } from '../realtime/queueWebSocket'

export interface UseServiceTimerReturn {
  status: ServiceTimerEvent | null
  remainingSeconds: number
  isTimerRunning: boolean
  hasServiceTimer: boolean
  checkOut: (queueId: string) => Promise<void>
}

export function useServiceTimer(userId: string | null, initialStatus?: ServiceTimerStatus | null): UseServiceTimerReturn {
  const initialEvent = initialStatus ? ({
    event: 'SERVICE_COUNTDOWN_START' as const,
    queueId: '',
    totalSeconds: initialStatus.remainingSeconds,
    timestamp: Date.now(),
    ...initialStatus,
  }) : null

  const [status, setStatus] = useState<ServiceTimerEvent | null>(initialEvent)
  const [remainingSeconds, setRemainingSeconds] = useState(initialStatus?.remainingSeconds ?? 0)
  const [isTimerRunning, setIsTimerRunning] = useState(initialStatus?.isTimerRunning ?? false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Don't connect if userId is empty or invalid
  const validUserId = userId && userId.length > 0 ? userId : null

  const startLocalCountdown = useCallback((totalSeconds: number) => {
    stopLocalCountdown()
    let remaining = totalSeconds
    intervalRef.current = setInterval(() => {
      remaining--
      setRemainingSeconds(remaining)
      if (remaining <= 0) {
        stopLocalCountdown()
        setIsTimerRunning(false)
      }
    }, 1000)
  }, [])

  const stopLocalCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!validUserId) return

    const handleEvent = (event: ServiceTimerEvent) => {
      if (event.event === 'SERVICE_COUNTDOWN_START') {
        setStatus(event)
        setRemainingSeconds(event.totalSeconds)
        setIsTimerRunning(true)
        startLocalCountdown(event.totalSeconds)
      } else if (event.event === 'SERVICE_COUNTDOWN_UPDATE') {
        setRemainingSeconds(event.remainingSeconds)
        setStatus(prev => prev ? { ...prev, ...event, remainingSeconds: event.remainingSeconds } : null)
      } else if (event.event === 'USER_LEFT') {
        stopLocalCountdown()
        setIsTimerRunning(false)
        setRemainingSeconds(0)
        setStatus(null)
      }
    }

    queueWebSocket.connect(validUserId, {
      onServiceTimerEvent: handleEvent,
    })

    return () => {
      queueWebSocket.disconnect()
      stopLocalCountdown()
    }
  }, [validUserId, startLocalCountdown, stopLocalCountdown])

  const checkOut = useCallback(async (): Promise<void> => {
    if (!validUserId) return
    try {
      await fetch(`/api/queue/${validUserId}/exit`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Check out failed:', error)
    }
  }, [userId])

  return {
    status,
    remainingSeconds,
    isTimerRunning,
    hasServiceTimer: status?.hasServiceTimer ?? false,
    checkOut,
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function getTimerColor(seconds: number): string {
  if (seconds <= 10) return 'text-red-500'
  if (seconds <= 60) return 'text-amber-500'
  return 'text-green-500'
}

export function getTimerBgColor(seconds: number): string {
  if (seconds <= 10) return 'bg-red-500/10 border-red-500/30'
  if (seconds <= 60) return 'bg-amber-500/10 border-amber-500/30'
  return 'bg-green-500/10 border-green-500/30'
}