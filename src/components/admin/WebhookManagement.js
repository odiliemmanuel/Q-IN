import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Location, RefreshCw, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { Button } from '@/components/Button';
import { useState, useEffect } from 'react';
export function WebhookManagement() {
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Fetch webhooks
    useEffect(() => {
        const fetchWebhooks = async () => {
            setLoading(true);
            try {
                const data = await authApi.getWebhooks();
                setWebhooks(data.data || []);
            }
            catch (error) {
                setError(error.response?.data?.message || 'Failed to load webhooks');
            }
            finally {
                setLoading(false);
            }
        };
        fetchWebhooks();
    }, []);
    const handleTestWebhook = async (webhookId) => {
        setLoading(true);
        try {
            const data = await authApi.testWebhook(webhookId);
            // Show success/error message
            console.log('Webhook tested:', data.data);
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to test webhook');
        }
        finally {
            setLoading(false);
        }
    };
    const handleRefresh = async () => {
        setLoading(true);
        try {
            const data = await authApi.getWebhooks();
            setWebhooks(data.data || []);
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to refresh webhooks');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-primary", children: "Webhook Management" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-font-medium text-foreground mb-4", children: "Create Webhook" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { placeholder: "Endpoint URL", className: "rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary" }), _jsxs("select", { className: "rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "queue:created", children: "Queue Created" }), _jsx("option", { value: "queue:position_update", children: "Queue Position Update" }), _jsx("option", { value: "queue:closed", children: "Queue Closed" }), _jsx("option", { value: "user:promoted", children: "User Promoted" })] }), _jsx(Button, { onClick: () => { }, className: "col-span-2 py-2 px-4 rounded bg-primary text-white font-medium transition-colors", children: "Create Webhook" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-font-medium text-foreground mb-4", children: "Webhook Endpoints" }), webhooks.length === 0 && (_jsx("p", { className: "text-muted", children: "No webhooks configured" })), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-max border-border", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border text-muted/60 text-sm font-medium", children: [_jsx("th", { className: "text-left", children: "Endpoint" }), _jsx("th", { className: "text-left text-muted/60", children: "Events" }), _jsx("th", { className: "text-left text-muted/60", children: "Last Delivery" }), _jsx("th", { className: "text-left text-muted/60", children: "Status" }), _jsx("th", { className: "text-right text-muted/60", children: "Actions" })] }) }), _jsx("tbody", { children: webhooks.map((webhook) => (_jsxs("tr", { className: "border-b border-border/20 hover:bg-primary/5 transition-colors", children: [_jsx("td", { className: "font-medium text-foreground", children: webhook.endpoint }), _jsx("td", { children: webhook.events.map((event) => (_jsx("span", { className: "px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium mr-1", children: event }, event))) }), _jsx("td", { className: "text-muted/60 text-sm", children: webhook.lastDelivery || 'Never' }), _jsx("td", { children: webhook.status === 'success' ? (_jsx("span", { className: "px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium", children: "Success" })) : (_jsx("span", { className: "px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium", children: "Failed" })) }), _jsx("td", { className: "text-right", children: _jsx(Button, { onClick: () => handleTestWebhook(webhook.id), variant: "secondary", className: "py-1 px-2 text-xs rounded bg-primary/10 text-primary font-medium transition-colors", children: "Test" }) })] }, webhook.id))) })] }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-font-medium text-foreground mb-4", children: "Delivery History" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(MetricCard, { icon: "RefreshCw", value: webhooks.length, label: "Total Webhooks", status: "info" }), _jsx(MetricCard, { icon: "AlertCircle", value: webhooks.filter(w => w.status === 'failed').length, label: "Failed Deliveries", status: "critical" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-max border-border", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border text-muted/60 text-sm font-medium", children: [_jsx("th", { className: "text-left", children: "Event" }), _jsx("th", { className: "text-left text-muted/60", children: "Endpoint" }), _jsx("th", { className: "text-left text-muted/60", children: "Status" }), _jsx("th", { className: "text-left text-muted/60", children: "Attempts" }), _jsx("th", { className: "text-left text-muted/60", children: "Last Attempt" })] }) }), _jsx("tbody", { children: _jsxs("tr", { className: "border-b border-border/20 hover:bg-primary/5 transition-colors", children: [_jsx("td", { className: "font-medium text-foreground", children: "Queue Created" }), _jsx("td", { children: webhooks[0]?.endpoint || 'N/A' }), _jsx("td", { children: _jsx("span", { className: "px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium", children: "Success" }) }), _jsx("td", { children: "3" }), _jsx("td", { className: "text-muted/60 text-sm", children: "2 minutes ago" })] }) })] }) })] })] }));
}
