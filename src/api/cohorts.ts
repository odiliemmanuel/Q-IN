import { api, type ApiResponse } from './client'
import { API_ENDPOINTS } from './config'

export interface Cohort {
  id: string
  name: string
  isActive: boolean
  createdAt?: string
}

export interface CohortResponse {
  id: string
  name: string
}

export interface CreateCohortRequest {
  name: string
  description?: string
}

export const cohortsApi = {
  async getAllCohorts(): Promise<Cohort[]> {
    const response = await api.get<ApiResponse<CohortResponse[]>>(API_ENDPOINTS.cohorts.list, false)
    return response.data.map((c) => ({ id: c.id, name: c.name, isActive: true }))
  },

  async createCohort(data: CreateCohortRequest): Promise<Cohort> {
    const response = await api.post<ApiResponse<CohortResponse>>(API_ENDPOINTS.cohorts.create, data)
    return { id: response.data.id, name: response.data.name, isActive: true }
  },

  async disableCohort(id: string): Promise<void> {
    await api.patch<void>(API_ENDPOINTS.cohorts.disable(id))
  },

  async deleteCohort(id: string): Promise<void> {
    await api.delete<void>(API_ENDPOINTS.cohorts.delete(id))
  },
}
