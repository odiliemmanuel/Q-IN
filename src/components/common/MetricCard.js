import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Building, Users, Clock, ChartBar, ExclamationCircle, CheckCircle } from 'lucide-react';
export function MetricCard({ icon, value, label, status }) {
    const statusStyles = {
        good: 'bg-primary/10 text-primary',
        warning: 'bg-warning/10 text-warning-orange',
        critical: 'bg-destructive/10 text-destructive',
        info: 'bg-info/10 text-primary',
    };
    return (_jsxs("div", { className: `bg-card rounded-lg p-4 border border-border ${statusStyles[status]} hover:transition-colors duration-200 hover:bg-primary/5`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `w-4 h-4 text-${icon === 'Users' ? 'primary' : icon === 'Clock' ? 'info' : 'foreground'} ${icon}` }), _jsx("span", { className: "text-xs font-medium text-foreground", children: label })] }), _jsx("span", { className: "text-xs font-medium text-foreground opacity-70", children: status })] }), _jsx("span", { className: "text-3xl font-bold text-foreground", children: typeof value === 'number' ? value : value })] }));
}
