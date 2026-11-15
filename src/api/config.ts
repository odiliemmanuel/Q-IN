export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const API_ENDPOINTS = {
  auth: {
    login: '/users/login',
    adminLogin: '/admin/login',
    superAdminLogin: '/super-admin/login',
    register: '/users/register',
    verifyEmail: '/users/verify-email',
    verifyEmailAndLogin: '/users/verify-email',
    resendVerification: '/users/resend-verification',
    forgotPassword: '/users/forgot-password',
    resetPassword: '/users/reset-password',
    refreshToken: '/users/refresh-token',
    logout: '/users/logout',
  },
  users: {
    caricature: (userId: string) => `/users/${userId}/caricature`,
    updatePassword: '/users/update-password',
  },
  queues: {
    create: '/queue/create',
    all: '/queue/all',
    getUsers: (queueId: string) => `/queue/${queueId}/users`,
    getStats: (queueId: string) => `/queue/${queueId}/stats`,
    enter: (userId: string) => `/queue/${userId}/enter`,
    exit: (userId: string) => `/queue/${userId}/exit`,
    updateCapacity: (capacity: number) => `/queue/${capacity}/update/capacity`,
    delete: (queueId: string) => `/queue/${queueId}/delete`,
  },
  notifications: {
    list: '/notifications',
    unread: '/notifications/unread',
    unreadCount: '/notifications/unread/count',
    markRead: (notificationId: string) => `/notifications/${notificationId}/read`,
    markAllRead: '/notifications/read-all',
  },
  cohorts: {
    list: '/cohorts/cohorts',
    create: '/admin',
    disable: (id: string) => `/admin/${id}/disable`,
    delete: (id: string) => `/admin/${id}`,
  },
  admin: {
    login: '/admin/login',
  },
  superAdmin: {
    login: '/super-admin/login',
    createAdmin: '/super-admin/admins',
    promoteAdmin: '/super-admin/admins/promote',
    suspendAdmin: (id: string) => `/super-admin/admins/${id}/suspend`,
    deleteAdmin: (id: string) => `/super-admin/admins/${id}`,
  },
  health: '/health',
} as const