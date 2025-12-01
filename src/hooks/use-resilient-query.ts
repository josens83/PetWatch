'use client'

/**
 * Resilient Query Hooks
 * Production-grade data fetching with automatic retry and fallback
 */

import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiResponse } from '@/lib/api-client'
import { AppError, isRetryableError } from '@/lib/errors'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

interface ResilientQueryOptions<TData, TError = AppError> extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  url: string
  fallbackData?: TData
  onOffline?: () => void
  enableOfflineCache?: boolean
}

interface ResilientMutationOptions<TData, TVariables, TError = AppError>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  url: string
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  optimisticUpdate?: (variables: TVariables) => TData
  rollback?: (context: unknown) => void
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Resilient query hook with automatic error handling and offline support
 */
export function useResilientQuery<TData>(
  options: ResilientQueryOptions<TData>
): UseQueryResult<TData, AppError> & { isOffline: boolean } {
  const {
    url,
    fallbackData,
    onOffline,
    enableOfflineCache = true,
    ...queryOptions
  } = options

  const [isOffline, setIsOffline] = useState(false)

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => {
      setIsOffline(true)
      onOffline?.()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial state
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onOffline])

  const query = useQuery<TData, AppError>({
    ...queryOptions,
    queryFn: async () => {
      try {
        const response = await api.get<TData>(url)
        return response.data
      } catch (error) {
        if (error instanceof AppError) {
          // Log the error
          logger.error(`Query failed: ${url}`, error)

          // Return fallback data for certain errors
          if (!isRetryableError(error) && fallbackData !== undefined) {
            logger.info(`Using fallback data for ${url}`)
            return fallbackData
          }
        }
        throw error
      }
    },
  })

  return {
    ...query,
    isOffline,
    data: query.data ?? fallbackData,
  } as UseQueryResult<TData, AppError> & { isOffline: boolean }
}

/**
 * Resilient mutation hook with optimistic updates
 */
export function useResilientMutation<TData, TVariables>(
  options: ResilientMutationOptions<TData, TVariables>
): UseMutationResult<TData, AppError, TVariables> {
  const {
    url,
    method = 'POST',
    optimisticUpdate,
    rollback,
    ...mutationOptions
  } = options

  return useMutation<TData, AppError, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables) => {
      let response: ApiResponse<TData>

      switch (method) {
        case 'POST':
          response = await api.post<TData>(url, variables)
          break
        case 'PUT':
          response = await api.put<TData>(url, variables)
          break
        case 'PATCH':
          response = await api.patch<TData>(url, variables)
          break
        case 'DELETE':
          response = await api.delete<TData>(url)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      return response.data
    },
    onMutate: async (variables) => {
      // Perform optimistic update if provided
      if (optimisticUpdate) {
        return optimisticUpdate(variables)
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (rollback && context) {
        rollback(context)
      }

      logger.error(`Mutation failed: ${method} ${url}`, error)

      // Call original onError if provided
      mutationOptions.onError?.(error, variables, context)
    },
  })
}

/**
 * Hook for paginated queries with infinite scroll
 */
export function usePaginatedQuery<TData>(options: {
  url: string
  queryKey: unknown[]
  pageSize?: number
  getNextPageParam?: (lastPage: TData) => unknown
}) {
  const { url, queryKey, pageSize = 20 } = options

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [allData, setAllData] = useState<TData[]>([])

  const query = useResilientQuery<TData[]>({
    queryKey: [...queryKey, page],
    url: `${url}?page=${page}&limit=${pageSize}`,
  })

  useEffect(() => {
    if (query.data) {
      if (page === 1) {
        setAllData(query.data)
      } else {
        setAllData((prev) => [...prev, ...query.data])
      }
      setHasMore(query.data.length === pageSize)
    }
  }, [query.data, page, pageSize])

  const loadMore = useCallback(() => {
    if (hasMore && !query.isFetching) {
      setPage((p) => p + 1)
    }
  }, [hasMore, query.isFetching])

  const refresh = useCallback(() => {
    setPage(1)
    setAllData([])
    setHasMore(true)
  }, [])

  return {
    data: allData,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    hasMore,
    loadMore,
    refresh,
    isOffline: query.isOffline,
  }
}

/**
 * Hook for debounced search queries
 */
export function useSearchQuery<TData>(options: {
  url: string
  queryKey: unknown[]
  debounceMs?: number
  minLength?: number
}) {
  const { url, queryKey, debounceMs = 300, minLength = 2 } = options
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])

  const query = useResilientQuery<TData>({
    queryKey: [...queryKey, debouncedTerm],
    url: `${url}?q=${encodeURIComponent(debouncedTerm)}`,
    enabled: debouncedTerm.length >= minLength,
  })

  return {
    ...query,
    searchTerm,
    setSearchTerm,
    isSearching: debouncedTerm !== searchTerm,
  }
}
