import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useQueueStore } from '@/stores/queue';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/common/Input';
import { KpiTile } from '@/components/KpiTile';
import { useWS } from '@/lib/websocket';
import { useSearchParams } from 'react-router-dom';
export function QueueDetailPage() {
    const params = useSearchParams();
    const queueId = params.get('queueId') || '';
    const location = useLocation();
    const navigate = useNavigate();
    const setUser = useAuthStore(state => state.setUser);
    const setTokens = useAuthStore(state => state.setTokens);
    // Queue store state
    const { position, waitTime, status, activeQueue, setActiveQueue, setPosition, setWaitTime, setStatus } = useQueueStore.getState();
    // WebSocket
    const { isConnected, subscribeToQueueDetail, sendNotification } = useWS();
    useEffect(() => {
        // Fetch queue detail
        const fetchQueueDetail = async () => {
            try {
                const data = await authApi.getQueueDetail(queueId);
                setActiveQueue(data.data || null);
                setPosition(data.data?.position || null);
                setWaitTime(data.data?.waitTime || null);
                setStatus(data.data?.status || 'WAITING');
            }
            catch (error) {
                console.error('Failed to fetch queue detail:', error);
            }
        };
        fetchQueueDetail();
        // Subscribe to real-time updates
        if (isConnected && queueId) {
            subscribeToQueueDetail(queueId, (event) => {
                if (event.type === 'queue:positionUpdate') {
                    const update = event.data;
                    setPosition(update.position);
                    setWaitTime(update.waitTime);
                    setStatus(update.status);
                }
            });
        }
        // Cleanup on unmount
        return () => {
            // Unsubscribe would go here
        };
    }, [queueId]);
    // Join queue
    const handleJoin = async () => {
        try {
            const data = await queueApi.joinQueue(queueId);
            setActiveQueue(data.queue || data);
            setPosition(data.position || null);
            setWaitTime(data.waitTime || null);
            setStatus(data.status || 'WAITING');
            navigate(`/dashboard/cohorts/queues/${queueId}`, { replace: true });
        }
        catch (error) {
            console.error('Failed to join queue:', error);
        }
    };
    if (!activeQueue) {
        return (_jsx("div", { className: "min-h-screen bg-background p-6", children: _jsxs("div", { className: "bg-panel rounded-lg p-8 max-w-md w-full shadow-lg border border-border", children: [_jsx("h2", { className: "text-2xl font-semibold text-primary mb-4", children: "Queue Detail" }), _jsx("p", { className: "text-muted", children: "Queue not found or inaccessible" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-background p-6", children: _jsxs("div", { className: "bg-panel rounded-lg p-6 mb-6 border border-border", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-semibold text-primary", children: activeQueue.name }), _jsx("p", { className: "text-muted mb-2", children: activeQueue.cohortId ? `Cohort: ${activeQueue.cohortId}` : '' }), _jsxs("p", { className: "text-sm text-muted", children: ["Status: ", _jsx("span", { className: activeQueue.status === 'OPEN' ? 'text-primary' : 'text-destructive', children: activeQueue.status })] })] }), activeQueue.status === 'OPEN' && (_jsx(Button, { onClick: handleJoin, className: "py-2 px-4 rounded bg-primary text-white font-medium transition-colors", children: position === null ? 'Join Queue' : `Join (Position ${position})` }))] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6", children: [_jsx(KpiTile, { icon: "Users", value: activeQueue.currentOccupancy, label: "Current Occupancy", status: "good" }), _jsx(KpiTile, { icon: "Layout", value: activeQueue.capacity, label: "Capacity", status: "good" }), _jsx(KpiTile, { icon: "Clock", value: waitTime || 0, label: "Est. Wait Time", status: "info" })] }), position !== null && waitTime !== null && (_jsxs("div", { className: "bg-card rounded-lg p-6 border border-border mb-6", children: [_jsx("h3", { className: "text-font-medium text-foreground mb-4", children: "Your Position" }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { children: "Your position" }), _jsxs("span", { children: [position, "/", activeQueue.capacity] })] }), _jsx("div", { className: "bg-border rounded-full h-2", children: _jsx("div", { className: `bg-primary rounded-full h-2 transition-width duration-500 ${(position / activeQueue.capacity) * 100}%`, style: { width: `${(position / activeQueue.capacity) * 100}%` } }) }), _jsxs("div", { className: "flex justify-between text-xs text-muted mt-2", children: [_jsx("span", { children: "Position" }), _jsx("span", { children: position })] }), _jsxs("div", { className: "flex justify-between text-xs text-muted", children: [_jsx("span", { children: "Wait Time" }), _jsxs("span", { children: [waitTime, "s"] })] })] })] })), status === 'IN_QUEUE' && (_jsx(Button, { onClick: () => {
                        // Confirm leave
                        if (window.confirm('Are you sure you want to leave the queue?')) {
                            queueApi.leaveQueue().then(() => {
                                setActiveQueue(null);
                                setPosition(null);
                                setWaitTime(null);
                                setStatus('LEFT');
                                navigate('/dashboard/cohorts/queues', { replace: true });
                            }).catch(() => {
                                // Handle error
                            });
                        }
                    }, variant: "destructive", className: "w-full py-3 px-4 rounded bg-destructive/10 text-destructive font-medium transition-colors", children: "Leave Queue" }))] }) }));
}
