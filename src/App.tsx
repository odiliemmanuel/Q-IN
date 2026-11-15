import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui'
import { AppShell } from './components/layout/AppShell'
import { useAuthStore } from './stores/auth'
import type { Role } from './lib/types'
import { LoginPage } from './pages/auth/LoginPage'
import { AdminLoginPage } from './pages/auth/AdminLoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { QueuesPage } from './pages/QueuesPage'
import { QueueDetailPage } from './pages/QueueDetailPage'
import { CohortsPage } from './pages/CohortsPage'
import { AdminPage } from './pages/AdminPage'
import { SuperAdminPage } from './pages/SuperAdminPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const user = useAuthStore((state) => state.user)

  if (!user) return <Navigate to="/login" replace />
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app/dashboard" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="queues" element={<QueuesPage />} />
          <Route path="queues/:queueId" element={<QueueDetailPage />} />
          <Route path="cohorts" element={<CohortsPage />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
