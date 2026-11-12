import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function KpiTile({ icon, value, label, status }) {
    const statusColors = {
        good: 'bg-primary/10 text-primary',
        warning: 'bg-warning/10 text-warning-orange',
        critical: 'bg-destructive/10 text-destructive',
    };
    return (_jsxs("div", { className: "bg-card rounded-lg p-4 border border-border flex flex-col gap-2 hover:transition-colors duration-200 hover:bg-primary/5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `w-5 h-5 text-primary ${icon}` }), _jsx("span", { className: "text-xs font-medium text-muted", children: status })] }), _jsx("span", { className: "text-xs font-medium text-muted", children: label })] }), _jsx("span", { className: "text-2xl font-bold text-foreground", children: typeof value === 'number' ? value : value })] }));
}
