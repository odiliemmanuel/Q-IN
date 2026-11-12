import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <div>
      <nav>
        <a href="/dashboard">Dashboard</a>
      </nav>
      <main>
        <p>Dashboard application - routes to be configured</p>
      </main>
    </div>
  </QueryClientProvider>
)