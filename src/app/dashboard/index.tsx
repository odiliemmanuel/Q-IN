import { Route } from 'react-router-dom'
import { CohortsPage } from './cohorts/cohorts-page'
import { QueuesPage } from './cohorts/queues-page'
import { QueueDetailPage } from './cohorts/queue-detail'
import { AdminDashboard } from './admin-dashboard'
import { SuperAdminDashboard } from './super-admin-dashboard'

export const DashboardRoutes: Route[] = [
  {
    path: '/dashboard',
    element: <div />, // Layout wrapper
    metadata: { title: 'Dashboard' },
    // Route group for protected routes
    // role-based access handled in layout
  },
  {
    path: '/dashboard/cohorts',
    element: <CohortsPage />,
    metadata: { title: 'Cohorts' },
  },
  {
    path: '/dashboard/cohorts/queues',
    element: <QueuesPage />,
    metadata: { title: 'Queues' },
  },
  {
    path: '/dashboard/cohorts/queues/:queueId',
    element: <QueueDetailPage />,
    metadata: { title: 'Queue Detail' },
  },
  {
    path: '/dashboard/admin',
    element: <AdminDashboard />,
    metadata: { title: 'Admin Panel' },
    // Access: ADMIN, SUPER_ADMIN
  },
  {
    path: '/dashboard/super-admin',
    element: <SuperAdminDashboard />,
    metadata: { title: 'Super Admin' },
    // Access: SUPER_ADMIN only
  },
]