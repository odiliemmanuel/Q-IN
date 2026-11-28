import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useQueueStore } from '../../stores/queue'

export function AppShell() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/app/admin') || 
                  location.pathname.startsWith('/app/cohorts') || 
                  location.pathname.startsWith('/app/super-admin')

  useEffect(() => {
    const hydrate = () => void useQueueStore.getState()[isAdmin ? 'hydrateFromBackend' : 'hydrateTodayQueues']()
    hydrate()
    window.addEventListener('focus', hydrate)
    const id = window.setInterval(hydrate, 30000)
    return () => {
      window.removeEventListener('focus', hydrate)
      window.clearInterval(id)
    }
  }, [isAdmin])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="lg:pl-72">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
