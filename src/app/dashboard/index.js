import { jsx as _jsx } from "react/jsx-runtime";
import { Route } from 'react-router-dom';
import { CohortsPage } from './cohorts/cohorts-page';
import { QueuesPage } from './cohorts/queues-page';
import { QueueDetailPage } from './cohorts/queue-detail';
import { AdminDashboard } from './admin-dashboard';
import { SuperAdminDashboard } from './super-admin-dashboard';
export const DashboardRoutes = [
    {
        path: '/dashboard',
        element: _jsx("div", {}), // Layout wrapper
        metadata: { title: 'Dashboard' },
        // Route group for protected routes
        // role-based access handled in layout
    },
    {
        path: '/dashboard/cohorts',
        element: _jsx(CohortsPage, {}),
        metadata: { title: 'Cohorts' },
    },
    {
        path: '/dashboard/cohorts/queues',
        element: _jsx(QueuesPage, {}),
        metadata: { title: 'Queues' },
    },
    {
        path: '/dashboard/cohorts/queues/:queueId',
        element: _jsx(QueueDetailPage, {}),
        metadata: { title: 'Queue Detail' },
    },
    {
        path: '/dashboard/admin',
        element: _jsx(AdminDashboard, {}),
        metadata: { title: 'Admin Panel' },
        // Access: ADMIN, SUPER_ADMIN
    },
    {
        path: '/dashboard/super-admin',
        element: _jsx(SuperAdminDashboard, {}),
        metadata: { title: 'Super Admin' },
        // Access: SUPER_ADMIN only
    },
];
