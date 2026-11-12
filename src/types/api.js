/**
 * API Response Types
 */
export const ROUTES = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        VERIFY_EMAIL: '/auth/verify-email',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
    },
    DASHBOARD: {
        ROOT: '/dashboard',
        COHORTS: '/dashboard/cohorts',
        QUEUES: '/dashboard/cohorts/queues',
        QUEUE_DETAIL: '/dashboard/cohorts/queues/:queueId',
        ADMIN_DASHBOARD: '/dashboard/admin',
        SUPER_ADMIN_DASHBOARD: '/dashboard/super-admin',
    },
};
/**
 * WebSocket Topic Patterns
 */
export const WS_TOPICS = {
    USER_QUEUE: (userId) => `/user/${userId}/queue`,
    QUEUE_DETAIL: (queueId) => `/queue/${queueId}`,
    ALL_QUEUES: '/queue',
};
