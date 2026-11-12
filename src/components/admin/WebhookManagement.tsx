import { Location, RefreshCw, AlertCircle } from 'lucide-react'
import { MetricCard } from '@/components/common/MetricCard'
import { Button } from '@/components/Button'
import { useState, useEffect } from 'react'

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<Array<{ id: string; endpoint: string; events: string[]; lastDelivery?: string; status: 'success' | 'failed' }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch webhooks
  useEffect(() => {
    const fetchWebhooks = async () => {
      setLoading(true)
      try {
        const data = await authApi.getWebhooks()
        setWebhooks(data.data || [])
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to load webhooks')
      } finally {
        setLoading(false)
      }
    }

    fetchWebhooks()
  }, [])

  const handleTestWebhook = async (webhookId: string) => {
    setLoading(true)
    try {
      const data = await authApi.testWebhook(webhookId)
      // Show success/error message
      console.log('Webhook tested:', data.data)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to test webhook')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const data = await authApi.getWebhooks()
      setWebhooks(data.data || [])
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to refresh webhooks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Webhook Management</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Create Webhook */}
      <div className="mb-6">
        <h3 className="text-font-medium text-foreground mb-4">Create Webhook</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Endpoint URL"
            className="rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            className="rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="queue:created">Queue Created</option>
            <option value="queue:position_update">Queue Position Update</option>
            <option value="queue:closed">Queue Closed</option>
            <option value="user:promoted">User Promoted</option>
          </select>
          <Button
            onClick={() => {}}
            className="col-span-2 py-2 px-4 rounded bg-primary text-white font-medium transition-colors"
          >
            Create Webhook
          </Button>
        </div>
      </div>

      {/* Webhooks Table */}
      <div>
        <h3 className="text-font-medium text-foreground mb-4">Webhook Endpoints</h3>

        {webhooks.length === 0 && (
          <p className="text-muted">No webhooks configured</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-border">
            <thead>
              <tr className="border-b border-border text-muted/60 text-sm font-medium">
                <th className="text-left">Endpoint</th>
                <th className="text-left text-muted/60">Events</th>
                <th className="text-left text-muted/60">Last Delivery</th>
                <th className="text-left text-muted/60">Status</th>
                <th className="text-right text-muted/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                  <td className="font-medium text-foreground">{webhook.endpoint}</td>
                  <td>
                    {webhook.events.map((event: string) => (
                      <span key={event} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium mr-1">
                        {event}
                      </span>
                    ))}
                  </td>
                  <td className="text-muted/60 text-sm">{webhook.lastDelivery || 'Never'}</td>
                  <td>
                    {webhook.status === 'success' ? (
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        Success
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <Button
                      onClick={() => handleTestWebhook(webhook.id)}
                      variant="secondary"
                      className="py-1 px-2 text-xs rounded bg-primary/10 text-primary font-medium transition-colors"
                    >
                      Test
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery History Section */}
      <div>
        <h3 className="text-font-medium text-foreground mb-4">Delivery History</h3>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon="RefreshCw"
            value={webhooks.length}
            label="Total Webhooks"
            status="info"
          />
          <MetricCard
            icon="AlertCircle"
            value={webhooks.filter(w => w.status === 'failed').length}
            label="Failed Deliveries"
            status="critical"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-border">
            <thead>
              <tr className="border-b border-border text-muted/60 text-sm font-medium">
                <th className="text-left">Event</th>
                <th className="text-left text-muted/60">Endpoint</th>
                <th className="text-left text-muted/60">Status</th>
                <th className="text-left text-muted/60">Attempts</th>
                <th className="text-left text-muted/60">Last Attempt</th>
              </tr>
            </thead>
            <tbody>
              {/* History rows would go here */}
              <tr className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                <td className="font-medium text-foreground">Queue Created</td>
                <td>{webhooks[0]?.endpoint || 'N/A'}</td>
                <td><span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">Success</span></td>
                <td>3</td>
                <td className="text-muted/60 text-sm">2 minutes ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}