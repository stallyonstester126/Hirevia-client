import { ApiResponse } from '../types'

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1'
const BASE_URL = rawApiUrl.endsWith('/v1')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, '')}/v1`

export class ApiError extends Error {
  statusCode: number
  data: any

  constructor(message: string, statusCode: number, data: any = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.data = data
  }
}

export const AUTH_TOKEN_KEY = 'hirevia_access_token'

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // Ignore storage errors
  }
}

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Ignore storage errors
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, body, ...customConfig } = options

  // Construct URL with query parameters
  let url = `${BASE_URL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const token = getAuthToken()
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const defaultHeaders: HeadersInit = isFormData
    ? { ...authHeaders }
    : {
        'Content-Type': 'application/json',
        ...authHeaders,
      }

  const config: RequestInit = {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body,
    cache: 'no-store', // Prevent browser and Next.js caching of dynamic API data
    credentials: 'include', // essential for cookie-based JWT authentication
    ...customConfig,
  }

  try {
    const response = await fetch(url, config)
    
    let responseData: any = null
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json()
    }

    if (!response.ok) {
      const errorMsg = responseData?.message || response.statusText || 'An error occurred'
      const errorStatus = responseData?.statusCode || response.status

      // Handle 401: backend has no refresh endpoint, redirect directly to /login
      if (errorStatus === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-unauthorized'))
      }

      throw new ApiError(errorMsg, errorStatus, responseData?.data)
    }

    return responseData as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Network failure or server is unreachable'
    throw new ApiError(message, 500)
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<ApiResponse<T>>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<ApiResponse<T>>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: isFormData ? body : body ? JSON.stringify(body) : undefined 
    })
  },
    
  put: <T>(endpoint: string, body?: any, options?: RequestOptions) => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<ApiResponse<T>>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: isFormData ? body : body ? JSON.stringify(body) : undefined 
    })
  },
    
  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    return request<ApiResponse<T>>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: isFormData ? body : body ? JSON.stringify(body) : undefined 
    })
  },
    
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<ApiResponse<T>>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) => 
    request<ApiResponse<T>>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),

  download: async (endpoint: string, defaultFilename = 'download') => {
    let url = `${BASE_URL}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new ApiError('Failed to download file', response.status)
    }

    const disposition = response.headers.get('content-disposition')
    let filename = defaultFilename
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/)
      if (match && match[1]) {
        filename = match[1]
      }
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },
}
