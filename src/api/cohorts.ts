import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface Cohort {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

export interface CreateCohortRequest {
  name: string
  description?: string
}

export const cohortsApi = {
  async getAllCohorts(): Promise<Cohort[]> {
    return api.get<Cohort[]>(API_ENDPOINTS.cohorts.list, false)
  },

  async createCohort(data: CreateCohortRequest): Promise<Cohort> {
    return api.post<Cohort>(API_ENDPOINTS.cohorts.create, data)
  },

  async disableCohort(id: string): Promise<void> {
    return api.patch<void>(API_ENDPOINTS.cohorts.disable(id))
  },

  async deleteCohort(id: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.cohorts.delete(id))
  },
}