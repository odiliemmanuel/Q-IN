import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bell, Mail, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { useNotificationStore } from '@/stores/notification';
import { Menu, MenuItem } from '@radix-ui/react-menu';
import { useEffect } from 'react';
export function NotificationBell() {
    const { incrementNotificationCount, resetNotificationCount } = useUIStore.getState();
    const { loadNotifications, markRead, markAllRead, deleteNotification, notifications, hasMore } = useNotificationStore.getState();
    useEffect(() => {
        // Load notifications on mount
        loadNotifications();
        // Set up interval for real-time check
        const interval = setInterval(() => {
            loadNotifications();
        }, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [loadNotifications]);
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { className: "flex items-center gap-2 p-2 rounded hover:bg-border transition-colors", "aria-label": "Notifications", children: [_jsx(Bell, { className: "w-5 h-5 text-foreground" }), incrementNotificationCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center", children: incrementNotificationCount > 0 ? incrementNotificationCount : "" }))] }), _jsxs(Menu, { children: [_jsxs("button", { className: "flex items-center gap-2 p-2 rounded hover:bg-border transition-colors", "aria-label": "User menu", children: [_jsx(Bell, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium text-foreground", children: "Notifications" })] }), _jsxs(MenuContent, { children: [notifications.length === 0 && (_jsx(MenuItem, { children: _jsx("span", { className: "text-muted/60", children: "No new notifications" }) })), notifications.length > 0 && (_jsx("div", { className: "max-h-80 overflow-y-auto space-y-2", children: notifications.map((notification) => (_jsx(MenuItem, { onClick: () => {
                                        // Navigate to relevant page
                                        console.log('Navigate to:', notification.relatedId);
                                    }, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0", children: _jsx(Bell, { className: "w-4 h-4 text-primary" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium truncate text-foreground", children: notification.title }), _jsx("p", { className: "text-muted/60 text-truncate small", children: notification.message })] })] }) }, notification.id))) })), _jsx(MenuItem, { onClick: markAllRead, children: "Mark all as read" })] })] })] }));
}
