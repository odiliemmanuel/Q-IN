import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/common/MetricCard';
import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics';
import { AdminManagement } from '@/components/admin/AdminManagement';
import { WebhookManagement } from '@/components/admin/WebhookManagement';
import { Button } from '@/components/Button';
export function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { user, role } = useAuthStore();
    const { toggleSidebar, theme, setTheme } = useUIStore.getState();
    // Check role
    if (role !== 'SUPER_ADMIN') {
        return null;
    }
    // State
    const [activeTab, setActiveTab] = useState('analytics');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Fetch platform analytics
    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const data = await authApi.getMetrics();
                console.log('Platform analytics:', data.data);
            }
            catch (error) {
                setError(error.response?.data?.message || 'Failed to load analytics');
            }
            finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-background p-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-primary mb-6", children: "Super Admin Dashboard" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "grid grid-cols-3 mb-6", children: [_jsx(Button, { onClick: () => setActiveTab('analytics'), className: activeTab === 'analytics' ? 'border-b-2 border-primary' : '', children: "Analytics" }), _jsx(Button, { onClick: () => setActiveTab('admins'), className: activeTab === 'admins' ? 'border-b-2 border-primary' : '', children: "Admin Management" }), _jsx(Button, { onClick: () => setActiveTab('webhooks'), className: activeTab === 'webhooks' ? 'border-b-2 border-primary' : '', children: "Webhooks" })] }), activeTab === 'analytics' && _jsx(PlatformAnalytics, {}), activeTab === 'admins' && _jsx(AdminManagement, {}), activeTab === 'webhooks' && _jsx(WebhookManagement, {})] }));
}
