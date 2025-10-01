import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { config, endpoints } from '@/config/environment'

// Extend axios config to include custom metadata
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: Record<string, unknown>
}

// Request/Response interfaces
export interface ApiError {
  message: string
  code: string
  details?: unknown
  statusCode: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Authentication token management
class TokenManager {
  private static readonly TOKEN_KEY = 'vibe_auth_token'
  private static readonly REFRESH_TOKEN_KEY = 'vibe_refresh_token'

  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.TOKEN_KEY)
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token)
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }
}

// API Client class with interceptors and error handling
class ApiClient {
  private axiosInstance: AxiosInstance
  private isRefreshing: boolean = false
  private failedQueue: Array<{
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
  }> = []

  constructor(baseURL: string, timeout: number = 30000) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': config.app.version,
        'X-Client-Name': config.app.name
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token and logging
    this.axiosInstance.interceptors.request.use(
      (config: CustomAxiosRequestConfig) => {
        const token = TokenManager.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data
          })
        }

        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor - Handle responses and errors
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log response time in development
        if (process.env.NODE_ENV === 'development') {
          const customConfig = response.config as CustomAxiosRequestConfig
          const startTime = customConfig.metadata?.startTime as Date | undefined
          const duration = startTime ? new Date().getTime() - startTime.getTime() : 0
          console.log('✅ API Response:', {
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
            status: response.status,
            duration: `${duration}ms`
          })
        }

        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig & { _retry?: boolean }

        // Handle 401 Unauthorized - Token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request while refresh is in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return this.axiosInstance(originalRequest)
            }).catch(err => Promise.reject(err))
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refreshToken = TokenManager.getRefreshToken()
            if (!refreshToken) {
              throw new Error('No refresh token available')
            }

            const response = await this.axiosInstance.post(endpoints.auth.refresh, {
              refreshToken
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data.data
            TokenManager.setToken(accessToken)
            TokenManager.setRefreshToken(newRefreshToken)

            // Process the failed queue
            this.failedQueue.forEach(({ resolve }) => resolve(accessToken))
            this.failedQueue = []

            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }
            return this.axiosInstance(originalRequest)
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            this.failedQueue.forEach(({ reject }) => reject(refreshError))
            this.failedQueue = []
            TokenManager.clearTokens()

            // Emit auth failure event for app to handle
            window.dispatchEvent(new CustomEvent('auth:failure'))

            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // Transform axios error to our ApiError format
        const apiError: ApiError = {
          message: this.getErrorMessage(error),
          code: this.getErrorCode(error),
          statusCode: error.response?.status || 0,
          details: error.response?.data
        }

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ API Error:', {
            method: error.config?.method?.toUpperCase(),
            url: error.config?.url,
            status: error.response?.status,
            message: apiError.message
          })
        }

        return Promise.reject(apiError)
      }
    )
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Record<string, unknown>
      return (data.message as string) || (data.error as string) || 'An unexpected error occurred'
    }
    return error.message || 'Network error occurred'
  }

  private getErrorCode(error: AxiosError): string {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Record<string, unknown>
      return (data.code as string) || `HTTP_${error.response.status}`
    }
    return error.code || 'UNKNOWN_ERROR'
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.put(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.delete(url, config)
    return response.data
  }

  // Upload file with progress tracking
  async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })

    return response.data
  }
}

// Create API client instances
export const apiClient = new ApiClient(config.api.baseUrl, config.api.timeout)
export const liteApiClient = new ApiClient(config.services.liteApi.baseUrl, config.api.timeout)

// Export token manager for auth components
export { TokenManager }

// Export types (already declared above)