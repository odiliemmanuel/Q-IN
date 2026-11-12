import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useQueueStore } from '@/stores/queue';
import { useUIStore } from '@/stores/ui';
import { Button } from '@/components/Button';
import { Input } from '@/components/common/Input';
import { KpiTile } from '@/components/KpiTile';
import { CohortCard } from '@/components/cohort/CohortCard';
import { useNavigate } from 'react-router-dom';
export function CohortsPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cohorts, setCohorts] = useState([]);
    const [activeCohort, setActiveCohort] = useState(null);
    const navigate = useNavigate();
    const setUser = useAuthStore(state => state.setUser);
    const setTokens = useAuthStore(state => state.setTokens);
    // Fetch cohorts
    const fetchCohorts = async () => {
        setLoading(true);
        try {
            const data = await authApi.getCohorts();
            setCohorts(data.data || []);
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to load cohorts');
        }
        finally {
            setLoading(false);
        }
    };
    // Create cohort
    const handleCreateCohort = async (name, description) => {
        setLoading(true);
        try {
            const data = await authApi.createCohort(name, description);
            setCohorts(prev => [...prev, data.data]);
            setActiveCohort(data.data.id);
            fetchCohorts();
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to create cohort');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background p-6", children: [_jsxs("div", { className: "bg-panel rounded-lg p-6 mb-6 border border-border", children: [_jsx("h1", { className: "text-2xl font-semibold text-primary mb-4", children: "Cohorts" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-card rounded-lg p-6 border border-border mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-foreground mb-3", children: "Create Cohort" }), _jsx(Input, { placeholder: "Cohort name", className: "mb-2", onChange: (e) => { } }), _jsx(Input, { placeholder: "Description (optional)", type: "text", className: "mb-4", onChange: (e) => { } }), _jsx(Button, { onClick: () => { }, className: "w-full py-2 px-4 rounded bg-primary text-white font-medium", children: "Create Cohort" })] }), cohorts.map((cohort) => (_jsx(CohortCard, { cohort: cohort, onSelect: () => setActiveCohort(cohort.id), onDelete: () => { } }, cohort.id))), _jsx("button", { onClick: () => { }, className: "mt-4 w-full py-2 px-4 rounded bg-primary/10 text-primary border border-primary hover:bg-primary/5 font-medium transition-colors", children: "+ Create New Cohort" })] })] }), activeCohort && (_jsxs("div", { className: "bg-panel rounded-lg p-6 border border-border mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-primary mb-4", children: ["Queues - ", activeCohort] }), loading && _jsx("p", { className: "text-muted", children: "Loading queues..." }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: cohorts.map((cohort) => {
                            if (cohort.id === activeCohort) {
                                return (_jsx("div", { className: "bg-card rounded-lg p-4 border border-border", children: _jsx("p", { className: "text-muted", children: "Queues for this cohort would appear here" }) }, cohort.id));
                            }
                            return null;
                        }) })] }))] }));
}
