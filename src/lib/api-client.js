import axios, {} from 'axios';
// API base URL from environment
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000/ws';
// Axios instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
});
/**
 * Interceptors
 */
// Request interceptor - add auth token
api.interceptors.request.use(async (config) => {
    const storedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
    if (storedTokens) {
        try {
            const tokens = JSON.parse(storedTokens);
            // Check if token is expired
            const now = Date.now() / 1000;
            if (tokens.exp > now) {
                config.headers.Authorization = `Bearer ${tokens.accessToken}`;
            }
            else {
                // Token expired, try to refresh
                await refreshAuthTokens(config);
            }
        }
        catch (error) {
            console.error('Failed to parse stored tokens', error);
        }
    }
    return config;
}, (error) => Promise.reject(error));
// Response interceptor - handle auth errors and token refresh
api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            await refreshAuthTokens(originalRequest);
            // Retry the original request
            return api(originalRequest);
        }
        catch (refreshError) {
            // Refresh failed, logout user
            logoutUser();
        }
    }
    return Promise.reject(error);
});
/**
 * Refresh auth tokens using refresh token
 */
async function refreshAuthTokens(originalRequest) {
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.TOKENS);
    if (!storedRefreshToken) {
        logoutUser();
        return Promise.reject(new Error('No refresh token available'));
    }
    try {
        const { data } = await api.post('/auth/refresh-token', {
            refreshToken: storedRefreshToken,
        });
        if (data.success && data.data) {
            const { accessToken, refreshToken, expiresIn } = data.data;
            const exp = Date.now() / 1000 + expiresIn * 1000;
            const storedTokens = {
                accessToken,
                refreshToken,
                exp,
                iat: Date.now() / 1000,
            };
            localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(storedTokens));
            // Update the original request header if provided
            if (originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        else {
            logoutUser();
        }
    }
    catch (error) {
        logoutUser();
        throw error;
    }
}
/**
 * Logout user and clear all state
 */
function logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // Dispatch a global event so stores can update
    window.dispatchEvent(new Event('q-in:logout'));
}
/**
 * Auth utilities
 */
export const getStoredUser = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored)
        return null;
    try {
        return JSON.parse(stored);
    }
    catch {
        return null;
    }
};
export const setStoredUser = (user) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};
export const clearStoredUser = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
};
/**
 * API methods
 */
export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials).then((res) => res.data),
    register: (data) => api.post('/auth/register', data).then((res) => res.data),
    verifyEmail: (code) => api.post('/auth/verify-email', { code }).then((res) => res.data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }).then((res) => res.data),
};
export const userApi = {
    getCurrentUser: () => api.get('/auth/me').then((res) => res.data),
    resendVerification: () => api.post('/auth/resend-verification').then((res) => res.data),
};
export const queueApi = {
    getCohorts: () => api.get('/cohorts').then((res) => res.data),
    createCohort: (name, description) => api.post('/cohorts', { name, description }).then((res) => res.data),
    getQueues: (cohortId) => api.get('/queues' + (cohortId ? `?cohortId=${cohortId}` : '')).then((res) => res.data),
    createQueue: (name, cohortId, capacity) => api.post('/queues', { name, cohortId, capacity }).then((res) => res.data),
    getQueueDetail: (queueId) => api.get(`/queues/${queueId}`).then((res) => res.data),
    joinQueue: (queueId) => api.post(`/queues/${queueId}/join`).then((res) => res.data),
    leaveQueue: () => api.post('/queues/leave').then((res) => res.data),
    getQueuePosition: (queueId) => api.get(`/queues/${queueId}/position`).then((res) => res.data),
    toggleQueue: (queueId, open) => api.post(`/queues/${queueId}/toggle`, { open }).then((res) => res.data),
};
export const notificationApi = {
    getNotifications: (page = 1, limit = 20) => api.get(`/notifications?page=${page}&limit=${limit}`).then((res) => res.data),
    markRead: (notificationId) => api.post(`/notifications/${notificationId}/read`).then((res) => res.data),
    markAllRead: () => api.post('/notifications/mark-all-read').then((res) => res.data),
    deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`).then((res) => res.data),
};
export const adminApi = {
    getMetrics: () => api.get('/admin/metrics').then((res) => res.data),
    getQueues: () => api.get('/admin/queues').then((res) => res.data),
    createAdmin: (email, role) => api.post('/admin/create-admin', { email, role }).then((res) => res.data),
    getAdmins: () => api.get('/admin/list').then((res) => res.data),
    promoteUser: (userId) => api.post('/admin/promote', { userId }).then((res) => res.data),
    suspendAdmin: (adminId) => api.post('/admin/suspend', { adminId }).then((res) => res.data),
    reactivateAdmin: (adminId) => api.post('/admin/reactivate', { adminId }).then((res) => res.data),
    deleteAdmin: (adminId) => api.delete(`/admin/${adminId}`).then((res) => res.data),
    getWebhooks: () => api.get('/admin/webhooks').then((res) => res.data),
    createWebhook: (endpoint, events) => api.post('/admin/webhooks', { endpoint, events }).then((res) => res.data),
    getWebhookHistory: () => api.get('/admin/webhook-history').then((res) => res.data),
    testWebhook: (webhookId) => api.post(`/admin/webhooks/${webhookId}/test`).then((res) => res.data),
};
export const routerApi = {
    getRouteRecords: () => api.get('/routes').then((res) => res.data),
    getAllowedPaths: (role) => api.get(`/routes/allowed?role=${role}`).then((res) => res.data),
};
export { BASE_URL, WS_URL };
