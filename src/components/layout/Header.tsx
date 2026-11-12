import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { Logo, LogOut, User, Mail, Settings, ChevronDown, Bell } from 'lucide-react'
import { Menu, MenuItem } from '@radix-ui/react-menu'

export function LayoutHeader({
  toggleSidebar,
  theme,
  setTheme,
  user,
  onLogout,
}: {
  toggleSidebar: () => void
  theme: 'light' | 'dark'
  setTheme: (mode: 'light' | 'dark') => void
  user: { id: string; name: string; email: string; role: 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN'; emailVerified: boolean; createdAt: string; }
  onLogout: () => void
}) {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <header
      className="flex items-center justify-between px-6 py-4 bg-background border-b border-border bg-opacity-90 backdrop-blur-sm transition-colors duration-200"
    >
      <div className="flex items-center gap-3">
        <Logo className="w-8 h-8" />
        <h1 className="text-xl font-semibold text-primary">Q-In</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-border transition-colors"
          aria-label="Toggle sidebar"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded hover:bg-border transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Menu>
          <button
            className="flex items-center gap-2 p-2 rounded hover:bg-border transition-colors"
            aria-label="User menu"
          >
            <img
              src={`/avatars/avatar-${Math.floor(Math.random() * 5) + 1}.jpg`}
              alt="User"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium text-foreground">{user?.name || 'User'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          <Menu>
            <MenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </MenuItem>
            <MenuItem>
              <Mail className="w-4 h-4 mr-2" />
              Settings
            </MenuItem>
            <MenuItem onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </MenuItem>
          </Menu>
        </Menu>

        <NotificationBell />
      </div>
    </header>
  )
}