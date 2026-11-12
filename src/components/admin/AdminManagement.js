import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Users, Building, Shield, Clock } from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard';
import { Button } from '@/components/Button';
export function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Fetch admins
    useEffect(() => {
        const fetchAdmins = async () => {
            setLoading(true);
            try {
                const data = await authApi.getAdmins();
                setAdmins(data.data || []);
            }
            catch (error) {
                setError(error.response?.data?.message || 'Failed to load admins');
            }
            finally {
                setLoading(false);
            }
        };
        fetchAdmins();
    }, []);
    const handleSuspend = async (adminId) => {
        setLoading(true);
        try {
            await authApi.suspendAdmin(adminId);
            setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, status: 'suspended' } : a));
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to suspend admin');
        }
        finally {
            setLoading(false);
        }
    };
    const handleReactivate = async (adminId) => {
        setLoading(true);
        try {
            await authApi.reactivateAdmin(adminId);
            setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, status: 'active' } : a));
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to reactivate admin');
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (adminId) => {
        setLoading(true);
        try {
            await authApi.deleteAdmin(adminId);
            setAdmins(prev => prev.filter(a => a.id !== adminId));
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to delete admin');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold text-primary", children: "Admin Management" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "bg-card rounded-lg p-6 border border-border", children: [_jsx("h3", { className: "text-font-medium text-foreground mb-4", children: "Admins" }), admins.length === 0 && (_jsx("p", { className: "text-muted", children: "No admins found" })), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-max border-border", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border text-muted/60 text-sm font-medium", children: [_jsx("th", { className: "text-left", children: "Name" }), _jsx("th", { className: "text-left text-muted/60", children: "Email" }), _jsx("th", { className: "text-left text-muted/60", children: "Role" }), _jsx("th", { className: "text-left text-muted/60", children: "Status" }), _jsx("th", { className: "text-right text-muted/60", children: "Actions" })] }) }), _jsx("tbody", { children: admins.map((admin) => (_jsxs("tr", { className: "border-b border-border/20 hover:bg-primary/5 transition-colors", children: [_jsx("td", { className: "font-medium text-foreground", children: admin.name }), _jsx("td", { className: "text-muted/60", children: admin.email }), _jsx("td", { children: admin.role === 'SUPER_ADMIN' ? (_jsx("span", { className: "px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-medium", children: "SUPER_ADMIN" })) : (_jsx("span", { className: "px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium", children: "ADMIN" })) }), _jsx("td", { children: admin.status === 'active' ? (_jsx("span", { className: "px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium", children: "Active" })) : (_jsx("span", { className: "px-2 py-1 rounded bg-warning/10 text-warning-orange text-xs font-medium", children: "Suspended" })) }), _jsxs("td", { className: "text-right", children: [admin.status === 'active' && (_jsx(Button, { onClick: () => handleSuspend(admin.id), variant: "secondary", className: "py-1 px-2 text-xs rounded bg-warning/10 text-warning-orange font-medium transition-colors", children: "Suspend" })), admin.status === 'suspended' && (_jsx(Button, { onClick: () => handleReactivate(admin.id), variant: "secondary", className: "py-1 px-2 rounded bg-primary/10 text-primary font-medium transition-colors", children: "Reactivate" })), _jsx(Button, { onClick: () => handleDelete(admin.id), variant: "destructive", className: "py-1 px-2 rounded bg-destructive/10 text-destructive font-medium transition-colors", children: "Delete" })] })] }, admin.id))) })] }) })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-font-medium text-foreground mb-4", children: "Create Admin" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { placeholder: "Name", className: "rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary" }), _jsx(Input, { type: "email", placeholder: "Email", className: "rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary" }), _jsxs("select", { className: "rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "ADMIN", children: "ADMIN" }), _jsx("option", { value: "SUPER_ADMIN", children: "SUPER_ADMIN" })] }), _jsx(Button, { onClick: () => { }, className: "col-span-2 py-2 px-4 rounded bg-primary text-white font-medium transition-colors", children: "Create Admin" })] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-font-medium text-foreground mb-4", children: "Promote User to Admin" }), _jsx(Input, { placeholder: "User email", className: "rounded border-border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary" }), _jsx(Button, { onClick: () => { }, className: "w-full py-3 px-4 rounded bg-primary text-white font-medium transition-colors", children: "Promote" })] })] }));
}
