import { ChartBar, Users, Clock, Location } from 'lucide-react'
import { MetricCard } from '@/components/common/MetricCard'

export function PlatformAnalytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Platform Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon="Users"
          value={1250}
          label="Total Users"
          status="good"
        />
        <MetricCard
          icon="Clock"
          value={245}
          label="Total Entries Today"
          status="good"
        />
        <MetricCard
          icon="ChartBar"
          value={4.5}
          label="Avg Wait Time (min)"
          status="info"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <MetricCard
          icon="Building"
          value={45}
          label="Active Cohorts"
          status="good"
        />
        <MetricCard
          icon="Users"
          value={12}
          label="Active Admins"
          status="good"
        />
      </div>

      <div className="mt-6">
        <h3 className="text-font-medium text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {/* Activity items would go here */}
          <div className="p-3 rounded bg-background text-sm">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted" />
              <div>
                <span className="font-medium text-foreground">New queue created</span>
                <span className="text-muted/60 text-xs">2 minutes ago</span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded bg-background text-sm">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-muted" />
              <div>
                <span className="font-medium text-foreground">User joined queue</span>
                <span className="text-muted/60 text-xs">5 minutes ago</span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded bg-background text-sm">
            <div className="flex items-center gap-3">
              <ChartBar className="w-4 h-4 text-muted" />
              <div>
                <span className="font-medium text-foreground">Queue status updated</span>
                <span className="text-muted/60 text-xs">10 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}