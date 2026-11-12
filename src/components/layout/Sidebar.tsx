import { useAuthStore } from '@/stores/auth'
import { Home, Building, Users, BarChart2, Settings, LogOut } from 'lucide-react'

export function LayoutSidebar({
  role,
}: {
  role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'
}) {
  const { sidebarOpen, setSidebarOpen } = useAuthStore.getState()

  const navLinks = [
    { href: '/dashboard/cohorts/queues', label: 'Queues', icon: Home, allowedRoles: ['NATIVE', 'ADMIN', 'SUPER_ADMIN'] },
    { href: '/dashboard/cohorts', label: 'Cohorts', icon: Building, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/dashboard/cohorts/queues', label: 'Manage Queues', icon: Building, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
  ]

  // Admin/SUPER_ADMIN specific links
  const adminLinks = [
    { href: '/dashboard/admin', label: 'Admin Panel', icon: Users, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/dashboard/super-admin', label: 'Super Admin', icon: BarChart2, allowedRoles: ['SUPER_ADMIN'] },
  ]

  return (
    <nav
      className="flex flex-col w-64 h-screen bg-background border-r border-border shadow-lg transition-all duration-300 transform-gpu block"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-primary">Q-In</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded hover:bg-border transition-colors"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <ul className="flex-1 flex flex-col gap-1 px-2 py-2">
        {navLinks.map((link) => {
          // Check if user has role to access this link
          const hasAccess = link.allowedRoles?.includes(role as any)
          if (!hasAccess) return null

          return (
            <li key={link.href}>
              <a
                href={link.href}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                aria-current={link.href === '/dashboard/cohorts/queues' ? 'page' : undefined}
              >
                <link.icon className="w-4 h-4 mr-2" />
                {sidebarOpen ? link.label : ''}
              </a>
            </li>
          )
        })}
      </ul>

      {/* Admin/SUPER_ADMIN specific links */}
      {role === 'ADMIN' || role === 'SUPER_ADMIN' && (
        <div className="px-2 pb-3 border-t border-border">
          {adminLinks.map((link) => {
            const hasAccess = link.allowedRoles?.includes(role as any)
            if (!hasAccess) return null

            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="w-full flex items-center rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {sidebarOpen ? link.label : ''}
                </a>
              </li>
            )
          })}
        </div>
      )}

      <div className="px-2 pb-3 border-t border-border">
        <button
          onClick={() => setSidebarOpen(false)}
          className="w-full flex items-center rounded-md px-3 py-2 text-xs font-medium text-muted hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </nav>
  )
}