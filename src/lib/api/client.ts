const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8100/api/v1'

// === Error Types ===

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'

export interface FieldError {
  field: string
  message: string
}

export interface ErrorDetail {
  code: ErrorCode
  message: string
  details?: FieldError[]
}

export interface ApiErrorResponse {
  error: ErrorDetail
}

export class ApiError extends Error {
  code: ErrorCode
  details?: FieldError[]
  status: number

  constructor(status: number, errorDetail: ErrorDetail) {
    super(errorDetail.message)
    this.name = 'ApiError'
    this.code = errorDetail.code
    this.details = errorDetail.details
    this.status = status
  }
}

// === HTTP Client ===

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: RequestMethod
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options

  let url = `${API_BASE_URL}${endpoint}`

  // Add query params
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Try to read JSON, but handle empty responses
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const errorResponse = data as ApiErrorResponse
    throw new ApiError(response.status, errorResponse.error)
  }

  // Return null for 204 No Content or empty responses
  if (response.status === 204 || !text) {
    return null as T
  }

  return data as T
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
}
