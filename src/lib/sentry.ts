/**
 * Sentry Error Tracking Configuration
 * Production-grade error monitoring
 */

import * as Sentry from '@sentry/nextjs'
import { AppError, isOperationalError } from './errors'

// ============================================================================
// Initialization
// ============================================================================

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Environment
      environment: process.env.NODE_ENV,

      // Release tracking
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

      // Sampling
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Replay for session recordings (production only)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Integrations
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Before send hook - filter out non-critical errors
      beforeSend(event, hint) {
        const error = hint?.originalException

        // Don't send operational errors to Sentry
        if (isOperationalError(error)) {
          // Only send if it's a 5xx error
          if (error instanceof AppError && error.statusCode < 500) {
            return null
          }
        }

        // Add additional context
        if (error instanceof AppError) {
          event.tags = {
            ...event.tags,
            errorCode: error.code,
            isOperational: String(error.isOperational),
          }
          event.extra = {
            ...event.extra,
            errorContext: error.context,
          }
        }

        return event
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        /^chrome-extension:\/\//,
        /^moz-extension:\/\//,
        // Network errors that are expected
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        // User-triggered errors
        'ResizeObserver loop',
        'Non-Error promise rejection',
      ],

      // Deny URLs
      denyUrls: [
        // Chrome extensions
        /extensions\//i,
        /^chrome:\/\//i,
        // Firefox extensions
        /^moz-extension:\/\//i,
      ],
    })
  }
}

// ============================================================================
// Error Capture Utilities
// ============================================================================

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: { id: string; email?: string }
    level?: Sentry.SeverityLevel
  }
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error('Sentry not configured, error:', error)
    return
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }

    if (context?.user) {
      scope.setUser(context.user)
    }

    if (context?.level) {
      scope.setLevel(context.level)
    }

    // Add error-specific context
    if (error instanceof AppError) {
      scope.setTag('errorCode', error.code)
      scope.setTag('isOperational', String(error.isOperational))
      scope.setExtra('errorContext', error.context)
    }

    Sentry.captureException(error)
  })
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log(`Sentry message (${level}):`, message, context)
    return
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }
    Sentry.captureMessage(message, level)
  })
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; name?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Add breadcrumb for tracing user actions
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Start a new transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {})
}

/**
 * Create a span for measuring specific operations
 */
export function measureOperation<T>(
  name: string,
  operation: () => T | Promise<T>
): T | Promise<T> {
  return Sentry.startSpan({ name, op: 'function' }, () => operation())
}

// ============================================================================
// React Error Boundary Integration
// ============================================================================

/**
 * Report error from React Error Boundary
 */
export function reportErrorBoundary(
  error: Error,
  errorInfo: { componentStack: string },
  level: 'page' | 'component' | 'app' = 'component'
) {
  captureException(error, {
    tags: {
      errorBoundaryLevel: level,
    },
    extra: {
      componentStack: errorInfo.componentStack,
    },
    level: level === 'app' ? 'fatal' : 'error',
  })
}

// ============================================================================
// API Error Tracking
// ============================================================================

/**
 * Track API errors
 */
export function trackApiError(
  error: Error | unknown,
  endpoint: string,
  method: string,
  statusCode?: number
) {
  captureException(error, {
    tags: {
      type: 'api_error',
      endpoint,
      method,
      statusCode: statusCode?.toString() || 'unknown',
    },
    extra: {
      endpoint,
      method,
      statusCode,
    },
  })
}

/**
 * Track slow API responses
 */
export function trackSlowApi(
  endpoint: string,
  duration: number,
  threshold: number = 3000
) {
  if (duration > threshold) {
    captureMessage(`Slow API response: ${endpoint}`, 'warning', {
      endpoint,
      duration,
      threshold,
    })
  }
}
