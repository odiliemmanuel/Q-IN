import { Building, Users, Clock, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { useQueueStore } from '@/stores/queue'

interface QueueCardProps {
  queue: Queue
  onJoin: (queueId: string) => void
  onToggle: (queueId: string, open: boolean) => void
}

export function QueueCard({ queue, onJoin, onToggle }: QueueCardProps) {
  const { position, waitTime, status } = useQueueStore.getState()

  const isUserInQueue = position !== null && waitTime !== null

  return (
    <div
      className="bg-card rounded-lg overflow-shadow p-6 border border-border hover:hover:transition-transform hover:hover:scale-105 duration-200 group"
    >
      <h3 className="font-medium text-foreground line-clamp-2">{queue.name}</h3>

      <div className="flex items-center gap-2 text-sm text-muted mb-2">
        <Building className="w-3 h-3" /> {queue.cohortId}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-foreground font-medium">Capacity</span>
          <span>{queue.capacity}</span>
        </div>
        <div>
          <span className="text-foreground font-medium">Current</span>
          <span>{queue.currentOccupancy}/{queue.capacity}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-3 flex items-center gap-2">
        {queue.status === 'OPEN' ? (
          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">
            Open
          </span>
        ) : (
          <span className="px-2 py-1 rounded bg-destructive/10 text-destructive text-sm font-medium">
            Closed
          </span>
        )}

        {isUserInQueue && (
          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">
            Position {position}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        {queue.status === 'OPEN' ? (
          <Button
            onClick={() => onJoin(queue.id)}
            className="flex-1 py-2 rounded bg-primary text-white font-medium transition-colors"
          >
            Join Queue
          </Button>
        ) : (
          <span className="flex-1 py-2 rounded bg-muted text-muted text-sm">Queue closed</span>
        )}

        {queue.status === 'OPEN' && (
          <Button
            onClick={() => onToggle(queue.id, false)}
            variant="secondary"
            className="flex-1 py-2 rounded bg-background text-foreground font-medium transition-colors"
          >
            Close Queue
          </Button>
        )}
      </div>
    </div>
  )
}