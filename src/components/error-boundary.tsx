'use client'

/**
 * Error Boundary Components
 * Hierarchical error handling with graceful degradation
 */

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'app' | 'page' | 'component'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ============================================================================
// Error Boundary Class
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component' } = this.props

    // Log error
    logger.error(`ErrorBoundary caught error at ${level} level`, error, {
      componentStack: errorInfo.componentStack,
      level,
    })

    // Report to Sentry (if available)
    if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: Error) => void } }).Sentry) {
      (window as unknown as { Sentry: { captureException: (e: Error) => void } }).Sentry.captureException(error)
    }

    // Custom error handler
    onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback, level = 'component' } = this.props

    if (hasError && error) {
      // Custom fallback
      if (typeof fallback === 'function') {
        return fallback(error, this.reset)
      }
      if (fallback) {
        return fallback
      }

      // Default fallbacks based on level
      switch (level) {
        case 'app':
          return <AppErrorFallback error={error} reset={this.reset} />
        case 'page':
          return <PageErrorFallback error={error} reset={this.reset} />
        default:
          return <ComponentErrorFallback error={error} reset={this.reset} />
      }
    }

    return children
  }
}

// ============================================================================
// Fallback Components
// ============================================================================

interface FallbackProps {
  error: Error
  reset: () => void
}

// App-level fallback (full page)
function AppErrorFallback({ error, reset }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">😿</div>
          <CardTitle className="text-2xl">앗! 문제가 발생했어요</CardTitle>
          <CardDescription>
            예기치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">오류 메시지:</p>
            <p className="text-sm text-red-600 mt-1">{error.message}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              다시 시도
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="w-full"
            >
              홈으로 이동
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            문제가 계속되면{' '}
            <a href="mailto:support@petwatch.kr" className="text-primary underline">
              고객센터
            </a>
            로 문의해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Page-level fallback (within layout)
function PageErrorFallback({ error, reset }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">🐕</div>
          <CardTitle>페이지를 불러올 수 없어요</CardTitle>
          <CardDescription>잠시 후 다시 시도해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-gray-600 break-all">{error.message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              다시 시도
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
              뒤로 가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component-level fallback (inline)
function ComponentErrorFallback({ error, reset }: FallbackProps) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-red-800">컴포넌트 오류</p>
          <p className="text-sm text-red-600 mt-1 truncate">{error.message}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={reset}
            className="mt-2"
          >
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// HOC for easy wrapping
// ============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ErrorBoundaryProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// ============================================================================
// Specialized Error Boundaries
// ============================================================================

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="app" onError={(error) => logger.fatal('App error', error)}>
      {children}
    </ErrorBoundary>
  )
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page">
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="component">
      {children}
    </ErrorBoundary>
  )
}

// ============================================================================
// Suspense-like Error Component
// ============================================================================

interface AsyncBoundaryProps {
  children: ReactNode
  errorFallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  loadingFallback?: ReactNode
}

export function AsyncBoundary({
  children,
  errorFallback,
  loadingFallback,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  )
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
