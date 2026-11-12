import { useUIStore } from '../store'
import { Logo } from 'lucide-react'

export function Header() {
  const { toggleSidebar, theme, setTheme } = useUIStore()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border bg-opacity-90 backdrop-blur-sm transition-colors duration-200">
      <div className="flex items-center gap-3">
        <Logo className="w-8 h-8" />
        <h1 className="text-xl font-semibold text-primary">PropertyFlow</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search input can be added here optionally */}
        {/* <div className="relative w-64"> */}
        {/*   <input type="text" placeholder="Search properties..." className="pl-3 pr-4 py-2 border border-border rounded" /> */}
        {/*   <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /> */}
        {/* </div> */}

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
        <button className="relative">
          <img
            src="/avatars/avatar-1.jpg"
            alt="User"
            className="w-8 h-8 rounded-full"
          />
          <div className="absolute right-0 top-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-white">
            JP
          </div>
        </button>
      </div>
    </header>
  )
}