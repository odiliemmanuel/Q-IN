import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/common/MetricCard';
import { QueueTable } from '@/components/admin/QueueTable';
import { CohortManagement } from '@/components/admin/CohortManagement';
import { AdminMetrics } from '@/components/admin/AdminMetrics';
import { Button } from '@/components/Button';
export function AdminDashboard() {
    const navigate = useNavigate();
    const { user, role } = useAuthStore();
    const { toggleSidebar, theme, setTheme } = useUIStore.getState();
    // Check role
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return null;
    }
    // State
    const [activeTab, setActiveTab] = useState('metrics');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Fetch metrics
    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const data = await authApi.getMetrics();
                // Store metrics in state or global store
                console.log('Metrics:', data.data);
            }
            catch (error) {
                setError(error.response?.data?.message || 'Failed to load metrics');
            }
            finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-background p-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-primary mb-6", children: "Admin Dashboard" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "grid grid-cols-3 mb-6", children: [_jsx(Button, { onClick: () => setActiveTab('metrics'), className: activeTab === 'metrics' ? 'border-b-2 border-primary' : '', children: "Metrics" }), _jsx(Button, { onClick: () => setActiveTab('queues'), className: activeTab === 'queues' ? 'border-b-2 border-primary' : '', children: "Queues" }), _jsx(Button, { onClick: () => setActiveTab('cohorts'), className: activeTab === 'cohorts' ? 'border-b-2 border-primary' : '', children: "Cohorts" })] }), activeTab === 'metrics' && _jsx(AdminMetrics, {}), activeTab === 'queues' && _jsx(QueueTable, {}), activeTab === 'cohorts' && _jsx(CohortManagement, {})] }));
}
