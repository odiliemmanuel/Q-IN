import { Building, Users, Clock, ChartBar, ExclamationCircle, CheckCircle } from 'lucide-react'

export interface MetricCardProps {
  icon: string
  value: string | number
  label: string
  status: 'good' | 'warning' | 'critical' | 'info'
}

export function MetricCard({ icon, value, label, status }: MetricCardProps) {
  const statusStyles = {
    good: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning-orange',
    critical: 'bg-destructive/10 text-destructive',
    info: 'bg-info/10 text-primary',
  }

  return (
    <div
      className={`bg-card rounded-lg p-4 border border-border ${statusStyles[status]} hover:transition-colors duration-200 hover:bg-primary/5`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 text-${icon === 'Users' ? 'primary' : icon === 'Clock' ? 'info' : 'foreground'} ${icon}`} />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <span className="text-xs font-medium text-foreground opacity-70">{status}</span>
      </div>

      <span className="text-3xl font-bold text-foreground">{typeof value === 'number' ? value : value}</span>
    </div>
  )
}