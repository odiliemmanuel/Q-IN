import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useQueueStore } from '@/stores/queue';
import { useUIStore } from '@/stores/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/common/Input';
import { KpiTile } from '@/components/KpiTile';
import { QueueCard } from '@/components/queue/QueueCard';
import { useNavigate } from 'react-router-dom';
import { useWS } from '@/lib/websocket';
export function QueuesPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [queues, setQueues] = useState([]);
    const [activeQueue, setActiveQueue] = useState(null);
    const [cohortId, setCohortId] = useState(null);
    const navigate = useNavigate();
    const setUser = useAuthStore(state => state.setUser);
    const setTokens = useAuthStore(state => state.setTokens);
    const { user } = useAuthStore();
    // WebSocket setup
    const { isConnected, subscribeToQueueDetail, sendNotification } = useWS();
    // Fetch queues
    useEffect(() => {
        const fetchQueues = async () => {
            setLoading(true);
            try {
                const data = await authApi.getQueues(cohortId);
                setQueues(data.data || []);
            }
            catch (error) {
                setError(error.response?.data?.message || 'Failed to load queues');
            }
            finally {
                setLoading(false);
            }
        };
        fetchQueues();
        // Set up WebSocket subscription if connected
        if (isConnected() && user?.id) {
            subscribeToUserQueue(user.id, (update) => {
                // Handle real-time position updates
                console.log('Position update:', update);
            });
        }
    }, [cohortId, isConnected]);
    // Join queue
    const handleJoinQueue = async (queueId) => {
        setLoading(true);
        try {
            const data = await queueApi.joinQueue(queueId);
            setActiveQueue(data.queue || data);
            setTokens(data.tokens || data);
            setUser(data.user || user);
            // Subscribe to real-time updates for this queue
            if (isConnected()) {
                subscribeToQueueDetail(queueId, (event) => {
                    console.log('Queue event:', event);
                });
            }
            navigate(`/dashboard/cohorts/queues/${queueId}`, { replace: true });
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to join queue');
        }
        finally {
            setLoading(false);
        }
    };
    // Create queue
    const handleCreateQueue = async (name, capacity) => {
        setLoading(true);
        try {
            const data = await authApi.createQueue(name, cohortId || '', capacity);
            setQueues(prev => [...prev, data.data]);
            setActiveQueue(data.data);
            navigate(`/dashboard/cohorts/queues/${data.data.id}`, { replace: true });
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to create queue');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-primary", children: "Queues" }), user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { placeholder: "Create queue...", className: "rounded-l-lg border border-border flex-1 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary", onChange: (e) => setCohortId?.(e.target.value) }), _jsx(Button, { onClick: () => handleCreateQueue('New Queue', 20), className: "rounded-r-lg bg-primary text-white py-2 px-4", children: "Create" })] }))] }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsx(KpiTile, { icon: "Users", value: queues.length, label: "Active Queues", status: "good" }), _jsx(KpiTile, { icon: "Layout", value: queues.reduce((sum, q) => sum + (q.currentOccupancy || 0), 0), label: "Total Capacity", status: "good" }), _jsx(KpiTile, { icon: "Clock", value: "30s", label: "TOTP Validity", status: "info" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [queues.map((queue) => (_jsx(QueueCard, { queue: queue, onJoin: handleJoinQueue, onToggle: toggleQueue }, queue.id))), !queues.length && user?.role !== 'SUPER_ADMIN' && (_jsx("div", { className: "col-span-full py-8 text-center text-muted", children: _jsx("p", { children: "No queues found. Create your first queue above." }) }))] })] }));
}
