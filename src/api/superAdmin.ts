import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface SuperAdminLoginRequest {
  userIdentifier: string
  pin: string
}

export interface SuperAdminLoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
  message: string
}

export interface CreateAdminRequest {
  firstName: string
  lastName: string
  userName: string
  email: string
  tempPin: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  phoneNumber: string
  whatsappNumber: string
}

export const superAdminApi = {
  async login(credentials: SuperAdminLoginRequest): Promise<SuperAdminLoginResponse> {
    return api.post<SuperAdminLoginResponse>(API_ENDPOINTS.superAdmin.login, credentials, false)
  },

  async createAdmin(data: CreateAdminRequest): Promise<void> {
    return api.post<void>(API_ENDPOINTS.superAdmin.createAdmin, data)
  },

  async promoteAdmin(email: string): Promise<void> {
    const query = new URLSearchParams({ email }).toString()
    return api.post<void>(`${API_ENDPOINTS.superAdmin.promoteAdmin}?${query}`)
  },

  async suspendAdmin(id: string): Promise<void> {
    return api.patch<void>(API_ENDPOINTS.superAdmin.suspendAdmin(id))
  },

  async deleteAdmin(id: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.superAdmin.deleteAdmin(id))
  },
}