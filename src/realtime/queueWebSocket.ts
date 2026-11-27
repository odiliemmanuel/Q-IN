import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { loadTokens } from '../lib/api'

export interface ServiceTimerStatus {
  hasServiceTimer: boolean
  serviceTimeMinutes: number
  gracePeriodMinutes: number
  totalAllowedMinutes: number
  remainingSeconds: number
  isTimerRunning: boolean
  isAtFront: boolean
  expiresAtEpochMillis: number
}

export type ServiceTimerEvent =
  | { event: 'SERVICE_COUNTDOWN_START'; queueId: string; totalSeconds: number; timestamp: number } & Partial<ServiceTimerStatus>
  | { event: 'SERVICE_COUNTDOWN_UPDATE'; queueId: string; remainingSeconds: number; timestamp: number } & Partial<ServiceTimerStatus>
  | { event: 'NEXT_USER_CAN_CHECK_IN'; queueId: string; message: string; timestamp: number } & Partial<ServiceTimerStatus>
  | { event: 'USER_LEFT'; queueId: string; userId: string; userName: string; remainingOccupants: number; timestamp: number } & Partial<ServiceTimerStatus>

export type QueuePositionEvent = {
  event: 'POSITION_UPDATE'
  queueId: string
  position: number
  queueName: string
  timestamp: number
}

export type QueueNotificationEvent = {
  event: 'QUEUE_NOTIFICATION'
  queueId: string
  title: string
  message: string
  timestamp: number
}

export type WebSocketEvent = ServiceTimerEvent | QueuePositionEvent | QueueNotificationEvent

export interface WebSocketCallbacks {
  onServiceTimerEvent?: (event: ServiceTimerEvent) => void
  onPositionUpdate?: (event: QueuePositionEvent) => void
  onNotification?: (event: QueueNotificationEvent) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Error) => void
}

class QueueWebSocket {
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private callbacks: WebSocketCallbacks = {}
  private userId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000

  connect(userId: string, callbacks: WebSocketCallbacks): void {
    this.userId = userId
    this.callbacks = callbacks

    if (this.client?.connected) {
      this.setupSubscriptions()
      return
    }

    const tokens = loadTokens()
    const wsUrl = (import.meta.env.VITE_WS_URL ?? `${window.location.origin}/ws`).replace(/\/$/, '')

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {},
      debug: (str) => {
        if (import.meta.env.DEV) console.log('[STOMP]', str)
      },
      reconnectDelay: this.reconnectDelay,
      onConnect: () => {
        this.reconnectAttempts = 0
        this.setupSubscriptions()
        this.callbacks.onConnected?.()
      },
      onDisconnect: () => {
        this.callbacks.onDisconnected?.()
        this.attemptReconnect()
      },
      onStompError: (frame) => {
        const error = new Error(frame.headers['message'] ?? 'WebSocket error')
        this.callbacks.onError?.(error)
      },
    })

    this.client.activate()
  }

  private setupSubscriptions(): void {
    if (!this.client?.connected || !this.userId) return

    const countdownSub = this.client.subscribe(`/user/${this.userId}/queue/countdown`, (msg: IMessage) => {
      try {
        const payload = JSON.parse(msg.body) as ServiceTimerEvent
        this.callbacks.onServiceTimerEvent?.(payload)
      } catch (e) {
        console.error('[WS] Failed to parse countdown message:', e)
      }
    })
    this.subscriptions.set('countdown', countdownSub)

    const positionSub = this.client.subscribe(`/user/${this.userId}/queue/position`, (msg: IMessage) => {
      try {
        const payload = JSON.parse(msg.body) as QueuePositionEvent
        this.callbacks.onPositionUpdate?.(payload)
      } catch (e) {
        console.error('[WS] Failed to parse position message:', e)
      }
    })
    this.subscriptions.set('position', positionSub)

    const notificationSub = this.client.subscribe(`/user/${this.userId}/queue/notifications`, (msg: IMessage) => {
      try {
        const payload = JSON.parse(msg.body) as QueueNotificationEvent
        this.callbacks.onNotification?.(payload)
      } catch (e) {
        console.error('[WS] Failed to parse notification message:', e)
      }
    })
    this.subscriptions.set('notifications', notificationSub)
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WS] Max reconnect attempts reached')
      return
    }
    this.reconnectAttempts++
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId, this.callbacks)
      }
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.subscriptions.clear()
    this.client?.deactivate()
    this.client = null
    this.userId = null
  }

  isConnected(): boolean {
    return this.client?.connected ?? false
  }
}

export const queueWebSocket = new QueueWebSocket()