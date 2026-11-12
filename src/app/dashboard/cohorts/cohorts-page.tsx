import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useQueueStore } from '@/stores/queue'
import { useUIStore } from '@/stores/ui'
import { Button } from '@/components/Button'
import { Input } from '@/components/common/Input'
import { KpiTile } from '@/components/KpiTile'
import { CohortCard } from '@/components/cohort/CohortCard'
import { useNavigate } from 'react-router-dom'

export function CohortsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [activeCohort, setActiveCohort] = useState<string | null>(null)
  const navigate = useNavigate()
  const setUser = useAuthStore(state => state.setUser)
  const setTokens = useAuthStore(state => state.setTokens)

  // Fetch cohorts
  const fetchCohorts = async () => {
    setLoading(true)
    try {
      const data = await authApi.getCohorts()
      setCohorts(data.data || [])
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load cohorts')
    } finally {
      setLoading(false)
    }
  }

  // Create cohort
  const handleCreateCohort = async (name: string, description: string) => {
    setLoading(true)
    try {
      const data = await authApi.createCohort(name, description)
      setCohorts(prev => [...prev, data.data])
      setActiveCohort(data.data.id)
      fetchCohorts()
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create cohort')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="bg-panel rounded-lg p-6 mb-6 border border-border">
        <h1 className="text-2xl font-semibold text-primary mb-4">Cohorts</h1>

        {error && (
          <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create New Cohort Form */}
          <div className="bg-card rounded-lg p-6 border border-border mb-4">
            <h3 className="text-lg font-medium text-foreground mb-3">Create Cohort</h3>
            <Input
              placeholder="Cohort name"
              className="mb-2"
              onChange={(e) => {}}
            />
            <Input
              placeholder="Description (optional)"
              type="text"
              className="mb-4"
              onChange={(e) => {}}
            />
            <Button
              onClick={() => {}}
              className="w-full py-2 px-4 rounded bg-primary text-white font-medium"
            >
              Create Cohort
            </Button>
          </div>

          {/* Cohort Cards */}
          {cohorts.map((cohort) => (
            <CohortCard
              key={cohort.id}
              cohort={cohort}
              onSelect={() => setActiveCohort(cohort.id)}
              onDelete={() => {}}
            />
          ))}

          {/* Add Cohort Button */}
          <button
            onClick={() => {}}
            className="mt-4 w-full py-2 px-4 rounded bg-primary/10 text-primary border border-primary hover:bg-primary/5 font-medium transition-colors"
          >
            + Create New Cohort
          </button>
        </div>
      </div>

      {/* Queue List for Active Cohort */}
      {activeCohort && (
        <div className="bg-panel rounded-lg p-6 border border-border mb-6">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Queues - {activeCohort}
          </h2>

          {loading && <p className="text-muted">Loading queues...</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cohorts.map((cohort) => {
              if (cohort.id === activeCohort) {
                return (
                  <div key={cohort.id} className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-muted">Queues for this cohort would appear here</p>
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}