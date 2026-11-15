import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface AdminLoginRequest {
  userIdentifier: string
  pin: string
}

export interface AdminLoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
  message: string
}

export const adminApi = {
  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    return api.post<AdminLoginResponse>(API_ENDPOINTS.admin.login, credentials, false)
  },
}