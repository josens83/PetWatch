/**
 * React Query Configuration
 * Production-grade client state management
 */

import { QueryClient, QueryClientConfig } from '@tanstack/react-query'
import { isRetryableError, AppError } from './errors'
import { logger } from './logger'

// ============================================================================
// Configuration
// ============================================================================

const MAX_RETRIES = 3
const STALE_TIME = 5 * 60 * 1000 // 5 minutes
const CACHE_TIME = 30 * 60 * 1000 // 30 minutes
const RETRY_DELAY_BASE = 1000 // 1 second

// ============================================================================
// Retry Logic
// ============================================================================

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) {
    return false
  }

  // Don't retry client errors (4xx except 408, 429)
  if (error instanceof AppError) {
    return isRetryableError(error)
  }

  // Retry network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  return false
}

function calculateRetryDelay(attemptIndex: number): number {
  // Exponential backoff with jitter
  const delay = Math.min(
    RETRY_DELAY_BASE * Math.pow(2, attemptIndex),
    30000 // Max 30 seconds
  )
  // Add random jitter (±25%)
  return delay * (0.75 + Math.random() * 0.5)
}

// ============================================================================
// Error Handler
// ============================================================================

function handleQueryError(error: unknown): void {
  if (error instanceof AppError) {
    logger.error('Query error', error, {
      code: error.code,
      statusCode: error.statusCode,
    })
  } else if (error instanceof Error) {
    logger.error('Query error', error)
  } else {
    logger.error('Unknown query error', undefined, { error })
  }
}

// ============================================================================
// Query Client Factory
// ============================================================================

export function createQueryClient(): QueryClient {
  const config: QueryClientConfig = {
    defaultOptions: {
      queries: {
        // Caching
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME, // Previously called cacheTime

        // Retry configuration
        retry: shouldRetry,
        retryDelay: calculateRetryDelay,

        // Refetch behavior
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        refetchOnMount: true,

        // Network mode
        networkMode: 'online',

        // Placeholder data behavior
        placeholderData: (prev: unknown) => prev,

        // Structural sharing for performance
        structuralSharing: true,
      },
      mutations: {
        // Retry configuration
        retry: (failureCount, error) => {
          // Be more conservative with mutations
          if (failureCount >= 2) return false
          return isRetryableError(error)
        },
        retryDelay: calculateRetryDelay,

        // Network mode
        networkMode: 'online',

        // Error handling
        onError: handleQueryError,
      },
    },
  }

  return new QueryClient(config)
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const queryKeys = {
  // User
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    subscription: () => [...queryKeys.user.all, 'subscription'] as const,
  },

  // Pets
  pets: {
    all: ['pets'] as const,
    lists: () => [...queryKeys.pets.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.pets.lists(), filters] as const,
    details: () => [...queryKeys.pets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pets.details(), id] as const,
    health: (id: string) => [...queryKeys.pets.detail(id), 'health'] as const,
    healthLogs: (id: string, filters?: Record<string, unknown>) =>
      [...queryKeys.pets.detail(id), 'healthLogs', filters] as const,
    analyses: (id: string) => [...queryKeys.pets.detail(id), 'analyses'] as const,
    alerts: (id: string) => [...queryKeys.pets.detail(id), 'alerts'] as const,
  },

  // Health Logs
  healthLogs: {
    all: ['healthLogs'] as const,
    lists: () => [...queryKeys.healthLogs.all, 'list'] as const,
    list: (petId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.healthLogs.lists(), petId, filters] as const,
    detail: (id: string) => [...queryKeys.healthLogs.all, 'detail', id] as const,
    daily: (petId: string, date: string) =>
      [...queryKeys.healthLogs.all, 'daily', petId, date] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    weekly: (petId: string, date?: string) =>
      [...queryKeys.reports.all, 'weekly', petId, date] as const,
    monthly: (petId: string, month?: string) =>
      [...queryKeys.reports.all, 'monthly', petId, month] as const,
    trends: (petId: string, period?: string) =>
      [...queryKeys.reports.all, 'trends', petId, period] as const,
  },

  // AI
  ai: {
    all: ['ai'] as const,
    analysis: (petId: string) => [...queryKeys.ai.all, 'analysis', petId] as const,
    chat: (sessionId: string) => [...queryKeys.ai.all, 'chat', sessionId] as const,
  },

  // Subscription
  subscription: {
    all: ['subscription'] as const,
    current: () => [...queryKeys.subscription.all, 'current'] as const,
    plans: () => [...queryKeys.subscription.all, 'plans'] as const,
    history: () => [...queryKeys.subscription.all, 'history'] as const,
  },
}

// ============================================================================
// Mutation Keys
// ============================================================================

export const mutationKeys = {
  pets: {
    create: ['pets', 'create'] as const,
    update: ['pets', 'update'] as const,
    delete: ['pets', 'delete'] as const,
  },
  healthLogs: {
    create: ['healthLogs', 'create'] as const,
    update: ['healthLogs', 'update'] as const,
    delete: ['healthLogs', 'delete'] as const,
  },
  subscription: {
    checkout: ['subscription', 'checkout'] as const,
    cancel: ['subscription', 'cancel'] as const,
    resume: ['subscription', 'resume'] as const,
  },
  user: {
    updateProfile: ['user', 'updateProfile'] as const,
    changePassword: ['user', 'changePassword'] as const,
    deleteAccount: ['user', 'deleteAccount'] as const,
  },
}
