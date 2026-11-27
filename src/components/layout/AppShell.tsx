import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useQueueStore } from '../../stores/queue'

export function AppShell() {
  useEffect(() => {
    const hydrate = () => void useQueueStore.getState().hydrateFromBackend()
    hydrate()
    window.addEventListener('focus', hydrate)
    const id = window.setInterval(hydrate, 30000)
    return () => {
      window.removeEventListener('focus', hydrate)
      window.clearInterval(id)
    }
  }, [])

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
