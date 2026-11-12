import { Users, Building, Shield, Clock } from 'lucide-react'
import { MetricCard } from '@/components/common/MetricCard'
import { Button } from '@/components/Button'

export function AdminManagement() {
  const [admins, setAdmins] = useState<Array<{ id: string; name: string; email: string; role: 'ADMIN' | 'SUPER_ADMIN'; status: 'active' | 'suspended' }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch admins
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true)
      try {
        const data = await authApi.getAdmins()
        setAdmins(data.data || [])
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to load admins')
      } finally {
        setLoading(false)
      }
    }

    fetchAdmins()
  }, [])

  const handleSuspend = async (adminId: string) => {
    setLoading(true)
    try {
      await authApi.suspendAdmin(adminId)
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, status: 'suspended' } : a))
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to suspend admin')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async (adminId: string) => {
    setLoading(true)
    try {
      await authApi.reactivateAdmin(adminId)
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, status: 'active' } : a))
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reactivate admin')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (adminId: string) => {
    setLoading(true)
    try {
      await authApi.deleteAdmin(adminId)
      setAdmins(prev => prev.filter(a => a.id !== adminId))
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Admin Management</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-font-medium text-foreground mb-4">Admins</h3>

        {admins.length === 0 && (
          <p className="text-muted">No admins found</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-border">
            <thead>
              <tr className="border-b border-border text-muted/60 text-sm font-medium">
                <th className="text-left">Name</th>
                <th className="text-left text-muted/60">Email</th>
                <th className="text-left text-muted/60">Role</th>
                <th className="text-left text-muted/60">Status</th>
                <th className="text-right text-muted/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                  <td className="font-medium text-foreground">{admin.name}</td>
                  <td className="text-muted/60">{admin.email}</td>
                  <td>
                    {admin.role === 'SUPER_ADMIN' ? (
                      <span className="px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium">
                        SUPER_ADMIN
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        ADMIN
                      </span>
                    )}
                  </td>
                  <td>
                    {admin.status === 'active' ? (
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-warning/10 text-warning-orange text-xs font-medium">Suspended</span>
                    )}
                  </td>
                  <td className="text-right">
                    {admin.status === 'active' && (
                      <Button
                        onClick={() => handleSuspend(admin.id)}
                        variant="secondary"
                        className="py-1 px-2 text-xs rounded bg-warning/10 text-warning-orange font-medium transition-colors"
                      >
                        Suspend
                      </Button>
                    )}
                    {admin.status === 'suspended' && (
                      <Button
                        onClick={() => handleReactivate(admin.id)}
                        variant="secondary"
                        className="py-1 px-2 rounded bg-primary/10 text-primary font-medium transition-colors"
                      >
                        Reactivate
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(admin.id)}
                      variant="destructive"
                      className="py-1 px-2 rounded bg-destructive/10 text-destructive font-medium transition-colors"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Admin */}
      <div className="mt-6">
        <h3 className="text-font-medium text-foreground mb-4">Create Admin</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Name"
            className="rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Input
            type="email"
            placeholder="Email"
            className="rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            className="rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <Button
            onClick={() => {}}
            className="col-span-2 py-2 px-4 rounded bg-primary text-white font-medium transition-colors"
          >
            Create Admin
          </Button>
        </div>
      </div>

      {/* Promote User */}
      <div className="mt-6">
        <h3 className="text-font-medium text-foreground mb-4">Promote User to Admin</h3>
        <Input
          placeholder="User email"
          className="rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          onClick={() => {}}
          className="w-full py-3 px-4 rounded bg-primary text-white font-medium transition-colors"
        >
          Promote
        </Button>
      </div>
    </div>
  )
}