import { Building, Users, Loader2, X } from 'lucide-react'
import { Button } from '@/components/Button'

interface CohortCardProps {
  cohort: { id: string; name: string; description?: string }
  onSelect: () => void
  onDelete: () => void
  isLoading?: boolean
}

export function CohortCard({ cohort, onSelect, onDelete, isLoading = false }: CohortCardProps) {
  return (
    <div
      className="bg-card rounded-lg p-6 border border-border hover:hover:transition-transform hover:hover:scale-105 duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
          <Building className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-2">{cohort.name}</h3>
          {cohort.description && (
            <p className="text-muted/60 text-truncate small">{cohort.description}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 pt-4 border-t border-border/20">
          <span className="text-xs text-muted/60">Loading queues...</span>
        </div>
      ) : (
        <Button
          onClick={onSelect}
          className="w-full py-2 px-4 rounded bg-primary/10 text-primary border border-primary hover:bg-primary/5 font-medium transition-colors text-sm"
        >
          View Queues
        </Button>
      )}

      <Button
        onClick={onDelete}
        variant="destructive"
        className="w-full py-2 px-4 rounded bg-destructive/10 text-destructive border border-destructive hover:bg-destructive/5 font-medium transition-colors text-sm mt-2"
      >
        Delete Cohort
      </Button>
    </div>
  )
}