import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthRoutes } from '@/app/auth'
import { DashboardRoutes } from '@/app/dashboard'
import { useNavigate } from 'react-router-dom'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <DashboardRoutes />
  </QueryClientProvider>
)