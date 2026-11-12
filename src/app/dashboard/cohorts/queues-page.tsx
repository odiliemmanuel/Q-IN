import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useQueueStore } from '@/stores/queue'
import { useUIStore } from '@/stores/ui'
import { Button } from '@/components/Button'
import { Input } from '@/components/common/Input'
import { KpiTile } from '@/components/KpiTile'
import { QueueCard } from '@/components/queue/QueueCard'
import { useNavigate } from 'react-router-dom'
import { useWS } from '@/lib/websocket'

export function QueuesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queues, setQueues] = useState<Array<Queue>>([])
  const [activeQueue, setActiveQueue] = useState<Queue | null>(null)
  const [cohortId, setCohortId] = useState<string | null>(null)
  const navigate = useNavigate()
  const setUser = useAuthStore(state => state.setUser)
  const setTokens = useAuthStore(state => state.setTokens)
  const { user } = useAuthStore()

  // WebSocket setup
  const { isConnected, subscribeToQueueDetail, sendNotification } = useWS()

  // Fetch queues
  useEffect(() => {
    const fetchQueues = async () => {
      setLoading(true)
      try {
        const data = await authApi.getQueues(cohortId)
        setQueues(data.data || [])
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to load queues')
      } finally {
        setLoading(false)
      }
    }

    fetchQueues()

    // Set up WebSocket subscription if connected
    if (isConnected() && user?.id) {
      subscribeToUserQueue(user.id, (update) => {
        // Handle real-time position updates
        console.log('Position update:', update)
      })
    }
  }, [cohortId, isConnected])

  // Join queue
  const handleJoinQueue = async (queueId: string) => {
    setLoading(true)
    try {
      const data = await queueApi.joinQueue(queueId)
      setActiveQueue(data.queue || data)
      setTokens(data.tokens || data)
      setUser(data.user || user)

      // Subscribe to real-time updates for this queue
      if (isConnected()) {
        subscribeToQueueDetail(queueId, (event) => {
          console.log('Queue event:', event)
        })
      }

      navigate(`/dashboard/cohorts/queues/${queueId}`, { replace: true })
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to join queue')
    } finally {
      setLoading(false)
    }
  }

  // Create queue
  const handleCreateQueue = async (name: string, capacity: number) => {
    setLoading(true)
    try {
      const data = await authApi.createQueue(name, cohortId || '', capacity)
      setQueues(prev => [...prev, data.data])
      setActiveQueue(data.data)
      navigate(`/dashboard/cohorts/queues/${data.data.id}`, { replace: true })
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create queue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Queues</h1>

        {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Create queue..."
              className="rounded-l-lg border border-border flex-1 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setCohortId?.(e.target.value)}
            />
            <Button
              onClick={() => handleCreateQueue('New Queue', 20)}
              className="rounded-r-lg bg-primary text-white py-2 px-4"
            >
              Create
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiTile
          icon="Users"
          value={queues.length}
          label="Active Queues"
          status="good"
        />
        <KpiTile
          icon="Layout"
          value={queues.reduce((sum, q) => sum + (q.currentOccupancy || 0), 0)}>
          label="Total Capacity"
          status="good"
        />
        <KpiTile
          icon="Clock"
          value="30s"
          label="TOTP Validity"
          status="info"
        />
      </div>

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queues.map((queue) => (
          <QueueCard
            key={queue.id}
            queue={queue}
            onJoin={handleJoinQueue}
            onToggle={toggleQueue}
          />
        ))}

        {/* Empty state */}
        {!queues.length && user?.role !== 'SUPER_ADMIN' && (
          <div className="col-span-full py-8 text-center text-muted">
            <p>No queues found. Create your first queue above.</p>
          </div>
        )}
      </div>
    </div>
  )
}