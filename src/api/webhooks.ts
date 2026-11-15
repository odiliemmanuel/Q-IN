import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface WebhookEndpoint {
  id: string
  name: string
  url: string
  active: boolean
  events: string[]
  retryCount: number
  timeoutMs: number
  createdAt: string
  updatedAt: string
  lastTriggeredAt?: string
  lastStatus?: number
  lastResponse?: string
}

export interface CreateWebhookRequest {
  name: string
  url: string
  secretKey: string
  events: string[]
  retryCount: number
  timeoutMs: number
}

export interface UpdateWebhookRequest {
  name?: string
  url?: string
  secretKey?: string
  events?: string[]
  active?: boolean
  retryCount?: number
  timeoutMs?: number
}

export interface WebhookDelivery {
  id: string
  endpointId: string
  eventType: string
  payload: string
  responseStatus: number
  responseBody: string
  attempt: number
  success: boolean
  errorMessage?: string
  createdAt: string
  deliveredAt?: string
}

export interface DeliveriesResponse {
  totalPages: number
  totalElements: number
  size: number
  content: WebhookDelivery[]
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  pageable: {
    offset: number
    paged: boolean
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    unpaged: boolean
  }
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export const webhooksApi = {
  async getAll(): Promise<WebhookEndpoint[]> {
    return api.get<WebhookEndpoint[]>(API_ENDPOINTS.webhooks.list)
  },

  async create(data: CreateWebhookRequest): Promise<WebhookEndpoint> {
    return api.post<WebhookEndpoint>(API_ENDPOINTS.webhooks.create, data)
  },

  async get(id: string): Promise<WebhookEndpoint> {
    return api.get<WebhookEndpoint>(API_ENDPOINTS.webhooks.get(id))
  },

  async update(id: string, data: UpdateWebhookRequest): Promise<WebhookEndpoint> {
    return api.patch<WebhookEndpoint>(API_ENDPOINTS.webhooks.update(id), data)
  },

  async delete(id: string): Promise<void> {
    return api.delete<void>(API_ENDPOINTS.webhooks.delete(id))
  },

  async test(id: string): Promise<void> {
    return api.post<void>(API_ENDPOINTS.webhooks.test(id))
  },

  async getDeliveries(id: string, page = 0, size = 20): Promise<DeliveriesResponse> {
    const query = new URLSearchParams({ page: page.toString(), size: size.toString() }).toString()
    return api.get<DeliveriesResponse>(`${API_ENDPOINTS.webhooks.deliveries(id)}?${query}`)
  },
}