// API Configuration - Updated to match Swagger spec from https://queueni.onrender.com

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const API_ENDPOINTS = {
  auth: {
    // User authentication
    login: '/api/v1/users/login',
    adminLogin: '/api/v1/admin/login',
    superAdminLogin: '/api/v1/super-admin/login',
    register: '/api/v1/users/register',
    verifyEmail: '/api/v1/users/verify-email',
    verifyEmailAndLogin: '/api/v1/users/verify-email',
    resendVerification: '/api/v1/users/resend-verification',
    forgotPassword: '/api/v1/users/forgot-password',
    resetPassword: '/api/v1/users/reset-password',
    refreshToken: '/api/v1/users/refresh-token',
    logout: '/api/v1/users/logout',
    updatePassword: '/api/v1/users/update-password',
  },
  users: {
    profilePicture: (userId: string) => `/api/v1/users/${userId}/profile-picture`,
  },
  queues: {
    create: '/api/queue/create',
    all: '/api/queue/all',
    getUsers: (queueId: string) => `/api/queue/${queueId}/users`,
    getStats: (queueId: string) => `/api/queue/${queueId}/stats`,
    enter: (userId: string) => `/api/queue/${userId}/enter`,
    exit: (userId: string) => `/api/queue/${userId}/exit`,
    close: (queueId: string) => `/api/queue/${queueId}/close`,
    updateCapacity: (capacity: number) => `/api/queue/${capacity}/update/capacity`,
    delete: (queueId: string) => `/api/queue/${queueId}/delete`,
  },
  notifications: {
    list: '/api/v1/notifications',
    unread: '/api/v1/notifications/unread',
    unreadCount: '/api/v1/notifications/unread/count',
    markRead: (notificationId: string) => `/api/v1/notifications/${notificationId}/read`,
    markAllRead: '/api/v1/notifications/read-all',
  },
  cohorts: {
    list: '/api/v1/cohorts',
    create: '/api/v1/admin',
    disable: (id: string) => `/api/v1/admin/${id}/disable`,
    delete: (id: string) => `/api/v1/admin/${id}`,
  },
  admin: {
    login: '/api/v1/admin/login',
  },
  superAdmin: {
    login: '/api/v1/super-admin/login',
    createAdmin: '/api/v1/super-admin/admins',
    promoteAdmin: '/api/v1/super-admin/admins/promote',
    suspendAdmin: (id: string) => `/api/v1/super-admin/admins/${id}/suspend`,
    deleteAdmin: (id: string) => `/api/v1/super-admin/admins/${id}`,
  },
  webhooks: {
    list: '/api/v1/webhooks',
    create: '/api/v1/webhooks',
    get: (id: string) => `/api/v1/webhooks/${id}`,
    update: (id: string) => `/api/v1/webhooks/${id}`,
    delete: (id: string) => `/api/v1/webhooks/${id}`,
    test: (id: string) => `/api/v1/webhooks/${id}/test`,
    deliveries: (id: string) => `/api/v1/webhooks/${id}/deliveries`,
  },
  health: '/api/health',
} as const