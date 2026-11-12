import { useUIStore } from '../store'
import { Home, Building, Users, BarChart2, Settings, LogOut } from 'lucide-react'

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/properties', label: 'Properties', icon: Building },
    { href: '/tenants', label: 'Tenants', icon: Users },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="flex flex-col w-64 h-screen bg-background border-r border-border shadow-lg transition-all duration-300 transform-gpu ${
      sidebarOpen ? 'block' : 'hidden'
    }">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-primary">PropertyFlow</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded hover:bg-border transition-colors"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <ul className="flex-1 flex flex-col gap-1 px-2 py-2">
        {navLinks.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              aria-current={link.href === '/' ? 'page' : undefined}
            >
              <link.icon className="w-4 h-4 mr-2" />
              {sidebarOpen ? link.label : ''}
            </a>
          </li>
        ))}
      </ul>

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