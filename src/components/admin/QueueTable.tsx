import { Building, Users, Clock, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/Button'

interface QueueRow {
  id: string
  name: string
  cohort: string
  capacity: number
  currentOccupancy: number
  status: 'OPEN' | 'CLOSED'
  positionUpdateAt: string
}

export interface QueueTableProps {
  queues: QueueRow[]
  onToggle: (queueId: string, open: boolean) => void
  onJoin: (queueId: string) => void
}

export function QueueTable({ queues, onToggle, onJoin }: QueueTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-border">
        <thead>
          <tr className="border-b border-border text-muted/60 text-sm font-medium">
            <th className="text-left">Queue</th>
            <th className="text-left text-muted/60">Cohort</th>
            <th className="text-left text-muted/60">Capacity</th>
            <th className="text-left text-muted/60">Current</th>
            <th className="text-left text-muted/60">Status</th>
            <th className="text-right text-muted/60">Actions</th>
          </tr>
        </thead>
        <tbody>
          {queues.map((queue) => (
            <tr key={queue.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
              <td className="font-medium text-foreground">{queue.name}</td>
              <td className="text-muted/60">{queue.cohort}</td>
              <td className="text-muted/60">{queue.currentOccupancy}/{queue.capacity}</td>
              <td className="text-muted/60">
                <ChartBar className="w-3 h-3" />
                {queue.currentOccupancy}
              </td>
              <td>
                {queue.status === 'OPEN' ? (
                  <CheckCircle className="w-3 h-3 text-primary" />
                ) : (
                  <X className="w-3 h-3 text-destructive" />
                )}
                {queue.status}
              </td>
              <td className="text-right">
                <Button
                  onClick={() => onToggle(queue.id, queue.status === 'OPEN')}
                  variant="secondary"
                  className="py-1 px-2 text-xs rounded bg-background text-foreground font-medium"
                >
                  {queue.status === 'OPEN' ? 'Close' : 'Open'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}