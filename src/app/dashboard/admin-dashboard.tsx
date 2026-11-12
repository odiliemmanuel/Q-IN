import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useNavigate } from 'react-router-dom'
import { MetricCard } from '@/components/common/MetricCard'
import { QueueTable } from '@/components/admin/QueueTable'
import { CohortManagement } from '@/components/admin/CohortManagement'
import { AdminMetrics } from '@/components/admin/AdminMetrics'
import { Button } from '@/components/Button'

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user, role } = useAuthStore()
  const { toggleSidebar, theme, setTheme } = useUIStore.getState()

  // Check role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return null
  }

  // State
  const [activeTab, setActiveTab] = useState<'metrics' | 'queues' | 'cohorts'>('metrics')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        const data = await authApi.getMetrics()
        // Store metrics in state or global store
        console.log('Metrics:', data.data)
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-semibold text-primary mb-6">Admin Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-3 mb-6">
        <Button
          onClick={() => setActiveTab('metrics')}
          className={activeTab === 'metrics' ? 'border-b-2 border-primary' : ''}
        >
          Metrics
        </Button>
        <Button
          onClick={() => setActiveTab('queues')}
          className={activeTab === 'queues' ? 'border-b-2 border-primary' : ''}
        >
          Queues
        </Button>
        <Button
          onClick={() => setActiveTab('cohorts')}
          className={activeTab === 'cohorts' ? 'border-b-2 border-primary' : ''}
        >
          Cohorts
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'metrics' && <AdminMetrics />}
      {activeTab === 'queues' && <QueueTable />}
      {activeTab === 'cohorts' && <CohortManagement />}
    </div>
  )
}