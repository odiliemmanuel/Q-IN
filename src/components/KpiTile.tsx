export interface KpiTileProps {
  icon: string // lucide-react icon name or CSS class
  value: string | number
  label: string
  status: 'good' | 'warning' | 'critical'
}

export function KpiTile({ icon, value, label, status }: KpiTileProps) {
  const statusColors = {
    good: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning-orange',
    critical: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-2 hover:transition-colors duration-200 hover:bg-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 text-primary ${icon}`} />
          <span className="text-xs font-medium text-muted">{status}</span>
        </div>
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>

      <span className="text-2xl font-bold text-foreground">{typeof value === 'number' ? value : value}</span>
    </div>
  )
}