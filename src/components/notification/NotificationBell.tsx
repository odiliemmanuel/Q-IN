import { Bell, Mail, Settings } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notification'
import { Menu, MenuItem } from '@radix-ui/react-menu'
import { useEffect } from 'react'

export function NotificationBell() {
  const { incrementNotificationCount, resetNotificationCount } = useUIStore.getState()
  const { loadNotifications, markRead, markAllRead, deleteNotification, notifications, hasMore } =
    useNotificationStore.getState()

  useEffect(() => {
    // Load notifications on mount
    loadNotifications()
    // Set up interval for real-time check
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [loadNotifications])

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 p-2 rounded hover:bg-border transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {incrementNotificationCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center"
          >
            {incrementNotificationCount > 0 ? incrementNotificationCount : ""}
          </span>
        )}
      </button>

      <Menu>
        <button
          className="flex items-center gap-2 p-2 rounded hover:bg-border transition-colors"
          aria-label="User menu"
        >
          <Bell className="w-5 h-5" />
          <span className="font-medium text-foreground">Notifications</span>
        </button>

        <MenuContent>
          {notifications.length === 0 && (
            <MenuItem>
              <span className="text-muted/60">No new notifications</span>
            </MenuItem>
          )}

          {notifications.length > 0 && (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {notifications.map((notification) => (
                <MenuItem key={notification.id} onClick={() => {
                  // Navigate to relevant page
                  console.log('Navigate to:', notification.relatedId)
                }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{notification.title}</p>
                      <p className="text-muted/60 text-truncate small">{notification.message}</p>
                    </div>
                  </div>
                </MenuItem>
              ))}
            </div>
          )}

          <MenuItem onClick={markAllRead}>
            Mark all as read
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  )
}