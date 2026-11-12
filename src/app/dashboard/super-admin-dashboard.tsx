import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useNavigate } from 'react-router-dom'
import { MetricCard } from '@/components/common/MetricCard'
import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics'
import { AdminManagement } from '@/components/admin/AdminManagement'
import { WebhookManagement } from '@/components/admin/WebhookManagement'
import { Button } from '@/components/Button'

export function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { user, role } = useAuthStore()
  const { toggleSidebar, theme, setTheme } = useUIStore.getState()

  // Check role
  if (role !== 'SUPER_ADMIN') {
    return null
  }

  // State
  const [activeTab, setActiveTab] = useState<'analytics' | 'admins' | 'webhooks'>('analytics')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch platform analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const data = await authApi.getMetrics()
        console.log('Platform analytics:', data.data)
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-semibold text-primary mb-6">Super Admin Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-3 mb-6">
        <Button
          onClick={() => setActiveTab('analytics')}
          className={activeTab === 'analytics' ? 'border-b-2 border-primary' : ''}
        >
          Analytics
        </Button>
        <Button
          onClick={() => setActiveTab('admins')}
          className={activeTab === 'admins' ? 'border-b-2 border-primary' : ''}
        >
          Admin Management
        </Button>
        <Button
          onClick={() => setActiveTab('webhooks')}
          className={activeTab === 'webhooks' ? 'border-b-2 border-primary' : ''}
        >
          Webhooks
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && <PlatformAnalytics />}
      {activeTab === 'admins' && <AdminManagement />}
      {activeTab === 'webhooks' && <WebhookManagement />}
    </div>
  )
}