import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { useLocation, useOutlet } from 'react-router-dom'
import { Button } from '@/components/Button'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, logout } = useAuthStore()
  const { toggleSidebar, theme, setTheme } = useUIStore()
  const outlet = useOutlet()

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/auth/login', { replace: true })
  }

  // Check if user is authenticated
  if (!user) {
    return null // Should not happen with route protection
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        toggleSidebar={toggleSidebar}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex min-h-[calc(100vh-64px)]">
        <Sidebar
          sidebarOpen={useUIStore.getState().sidebarOpen}
          setSidebarOpen={toggleSidebar}
          role={role}
        />
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {outlet}
        </div>
      </main>
    </div>
  )
}