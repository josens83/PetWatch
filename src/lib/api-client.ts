/**
 * Production-grade API Client
 * Features: Retry logic, timeout, circuit breaker, error handling
 */

import {
  AppError,
  HttpError,
  NetworkError,
  TimeoutError,
  ValidationError,
  isRetryableError,
  createErrorFromUnknown,
} from './errors'
import { getCircuitBreaker, CircuitBreaker } from './circuit-breaker'
import { logger } from './logger'

// ============================================================================
// Types
// ============================================================================

export interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  retryBackoff?: 'linear' | 'exponential'
  circuitBreaker?: string | false
  skipAuth?: boolean
}

export interface ApiResponse<T = unknown> {
  data: T
  status: number
  headers: Headers
}

interface RetryState {
  attempt: number
  lastError: Error | null
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 10000 // 10 seconds
const DEFAULT_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 30000 // 30 seconds

// ============================================================================
// Utility Functions
// ============================================================================

function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  backoff: 'linear' | 'exponential'
): number {
  let delay: number

  if (backoff === 'exponential') {
    delay = baseDelay * Math.pow(2, attempt - 1)
  } else {
    delay = baseDelay * attempt
  }

  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1)
  delay = Math.min(delay + jitter, MAX_RETRY_DELAY)

  return Math.round(delay)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private circuits: Map<string, CircuitBreaker> = new Map()

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    }
  }

  private getCircuit(name: string): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(
        name,
        getCircuitBreaker(name, {
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 30000,
          onStateChange: (from, to, circuitName) => {
            logger.warn(`Circuit ${circuitName} changed from ${from} to ${to}`)
          },
        })
      )
    }
    return this.circuits.get(name)!
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })
      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`요청 시간이 ${timeout}ms를 초과했습니다.`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async executeRequest<T>(
    url: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      retryBackoff = 'exponential',
      circuitBreaker = 'default',
      ...fetchConfig
    } = config

    const fullUrl = this.baseUrl + url
    const headers = {
      ...this.defaultHeaders,
      ...((fetchConfig.headers as Record<string, string>) || {}),
    }

    const doRequest = async (): Promise<ApiResponse<T>> => {
      const state: RetryState = { attempt: 0, lastError: null }

      while (state.attempt <= retries) {
        state.attempt++

        try {
          const response = await this.fetchWithTimeout(
            fullUrl,
            { ...fetchConfig, headers },
            timeout
          )

          // Handle non-2xx responses
          if (!response.ok) {
            let errorData: { message?: string; errors?: Record<string, string[]> } = {}

            try {
              errorData = await response.json()
            } catch {
              // Response body is not JSON
            }

            if (response.status === 422 && errorData.errors) {
              throw new ValidationError(errorData.message, errorData.errors)
            }

            throw new HttpError(
              response.status,
              errorData.message,
              undefined,
              { url: fullUrl, method: fetchConfig.method }
            )
          }

          // Parse response
          const contentType = response.headers.get('content-type')
          let data: T

          if (contentType?.includes('application/json')) {
            data = await response.json()
          } else {
            data = (await response.text()) as unknown as T
          }

          return {
            data,
            status: response.status,
            headers: response.headers,
          }
        } catch (error) {
          const appError = createErrorFromUnknown(error)
          state.lastError = appError

          // Log the error
          logger.warn(`API request failed (attempt ${state.attempt}/${retries + 1})`, {
            url: fullUrl,
            method: fetchConfig.method,
            error: appError.message,
            code: appError instanceof AppError ? appError.code : 'UNKNOWN',
          })

          // Check if we should retry
          if (state.attempt <= retries && isRetryableError(appError)) {
            const delay = calculateRetryDelay(state.attempt, retryDelay, retryBackoff)
            logger.info(`Retrying in ${delay}ms...`)
            await sleep(delay)
            continue
          }

          throw appError
        }
      }

      throw state.lastError || new NetworkError('요청이 실패했습니다.')
    }

    // Execute with or without circuit breaker
    if (circuitBreaker) {
      const circuit = this.getCircuit(circuitBreaker)
      return circuit.execute(doRequest)
    }

    return doRequest()
  }

  // HTTP Methods
  async get<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...config, method: 'GET' })
  }

  async post<T>(url: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(url: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(url: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(url, { ...config, method: 'DELETE' })
  }
}

// ============================================================================
// Default Instance
// ============================================================================

export const api = new ApiClient('/api')

// ============================================================================
// Convenience Functions
// ============================================================================

export async function fetcher<T>(url: string): Promise<T> {
  const { data } = await api.get<T>(url)
  return data
}

// For use with React Query mutations
export const mutationFetcher = {
  post: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await api.post<T>(url, data)
    return response.data
  },
  put: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await api.put<T>(url, data)
    return response.data
  },
  patch: async <T>(url: string, data: unknown): Promise<T> => {
    const response = await api.patch<T>(url, data)
    return response.data
  },
  delete: async <T>(url: string): Promise<T> => {
    const response = await api.delete<T>(url)
    return response.data
  },
}
