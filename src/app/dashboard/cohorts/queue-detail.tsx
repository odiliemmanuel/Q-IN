import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useQueueStore } from '@/stores/queue'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/ui'
import { Button } from '@/components/Button'
import { Input } from '@/components/common/Input'
import { KpiTile } from '@/components/KpiTile'
import { useWS } from '@/lib/websocket'
import { useSearchParams } from 'react-router-dom'

export function QueueDetailPage() {
  const params = useSearchParams()
  const queueId = params.get('queueId') || ''
  const location = useLocation()
  const navigate = useNavigate()
  const setUser = useAuthStore(state => state.setUser)
  const setTokens = useAuthStore(state => state.setTokens)

  // Queue store state
  const { position, waitTime, status, activeQueue, setActiveQueue, setPosition, setWaitTime, setStatus } =
    useQueueStore.getState()

  // WebSocket
  const { isConnected, subscribeToQueueDetail, sendNotification } = useWS()

  useEffect(() => {
    // Fetch queue detail
    const fetchQueueDetail = async () => {
      try {
        const data = await authApi.getQueueDetail(queueId)
        setActiveQueue(data.data || null)
        setPosition(data.data?.position || null)
        setWaitTime(data.data?.waitTime || null)
        setStatus(data.data?.status || 'WAITING')
      } catch (error: any) {
        console.error('Failed to fetch queue detail:', error)
      }
    }

    fetchQueueDetail()

    // Subscribe to real-time updates
    if (isConnected && queueId) {
      subscribeToQueueDetail(queueId, (event) => {
        if (event.type === 'queue:positionUpdate') {
          const update = event.data as QueuePositionUpdate
          setPosition(update.position)
          setWaitTime(update.waitTime)
          setStatus(update.status)
        }
      })
    }

    // Cleanup on unmount
    return () => {
      // Unsubscribe would go here
    }
  }, [queueId])

  // Join queue
  const handleJoin = async () => {
    try {
      const data = await queueApi.joinQueue(queueId)
      setActiveQueue(data.queue || data)
      setPosition(data.position || null)
      setWaitTime(data.waitTime || null)
      setStatus(data.status || 'WAITING')

      navigate(`/dashboard/cohorts/queues/${queueId}`, { replace: true })
    } catch (error: any) {
      console.error('Failed to join queue:', error)
    }
  }

  if (!activeQueue) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="bg-panel rounded-lg p-8 max-w-md w-full shadow-lg border border-border">
          <h2 className="text-2xl font-semibold text-primary mb-4">Queue Detail</h2>
          <p className="text-muted">Queue not found or inaccessible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="bg-panel rounded-lg p-6 mb-6 border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary">{activeQueue.name}</h2>
            <p className="text-muted mb-2">{activeQueue.cohortId ? `Cohort: ${activeQueue.cohortId}` : ''}</p>
            <p className="text-sm text-muted">
              Status: <span className={activeQueue.status === 'OPEN' ? 'text-primary' : 'text-destructive'}>
                {activeQueue.status}
              </span>
            </p>
          </div>

          {activeQueue.status === 'OPEN' && (
            <Button
              onClick={handleJoin}
              className="py-2 px-4 rounded bg-primary text-white font-medium transition-colors"
            >
              {position === null ? 'Join Queue' : `Join (Position ${position})`}
            </Button>
          )}
        </div>

        {/* Queue Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <KpiTile
            icon="Users"
            value={activeQueue.currentOccupancy}
            label="Current Occupancy"
            status="good"
          />
          <KpiTile
            icon="Layout"
            value={activeQueue.capacity}
            label="Capacity"
            status="good"
          />
          <KpiTile
            icon="Clock"
            value={waitTime || 0}
            label="Est. Wait Time"
            status="info"
          />
        </div>

        {/* Position & Progress Bar */}
        {position !== null && waitTime !== null && (
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <h3 className="text-font-medium text-foreground mb-4">Your Position</h3>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Your position</span>
                <span>{position}/{activeQueue.capacity}</span>
              </div>

              <div className="bg-border rounded-full h-2">
                <div
                  className={`bg-primary rounded-full h-2 transition-width duration-500 ${(position / activeQueue.capacity) * 100}%`}
                  style={{ width: `${(position / activeQueue.capacity) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-muted mt-2">
                <span>Position</span>
                <span>{position}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Wait Time</span>
                <span>{waitTime}s</span>
              </div>
            </div>
          </div>
        )}

        {/* Leave Queue Button */}
        {status === 'IN_QUEUE' && (
          <Button
            onClick={() => {
              // Confirm leave
              if (window.confirm('Are you sure you want to leave the queue?')) {
                queueApi.leaveQueue().then(() => {
                  setActiveQueue(null)
                  setPosition(null)
                  setWaitTime(null)
                  setStatus('LEFT')
                  navigate('/dashboard/cohorts/queues', { replace: true })
                }).catch(() => {
                  // Handle error
                })
              }
            }}
            variant="destructive"
            className="w-full py-3 px-4 rounded bg-destructive/10 text-destructive font-medium transition-colors"
          >
            Leave Queue
          </Button>
        )}
      </div>
    </div>
  )
}