/**
 * Next.js Middleware
 * Security, Rate Limiting, and Request Processing
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ============================================================================
// Configuration
// ============================================================================

// Rate limit configuration per route type
const RATE_LIMITS = {
  auth: { requests: 5, window: 60 }, // 5 requests per minute for auth
  api: { requests: 100, window: 60 }, // 100 requests per minute for general API
  ai: { requests: 20, window: 3600 }, // 20 requests per hour for AI (free tier)
  aiPremium: { requests: 100, window: 3600 }, // 100 requests per hour for AI (premium)
} as const

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/pets', '/health', '/reports', '/chat', '/subscription', '/settings']

// Public routes
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']

// ============================================================================
// Rate Limiting
// ============================================================================

function getRateLimitKey(ip: string, path: string): string {
  // Group by IP and route type
  if (path.startsWith('/api/auth')) {
    return `auth:${ip}`
  }
  if (path.startsWith('/api/ai')) {
    return `ai:${ip}`
  }
  return `api:${ip}`
}

function getRateLimitConfig(path: string, isPremium: boolean = false): { requests: number; window: number } {
  if (path.startsWith('/api/auth')) {
    return RATE_LIMITS.auth
  }
  if (path.startsWith('/api/ai')) {
    return isPremium ? RATE_LIMITS.aiPremium : RATE_LIMITS.ai
  }
  return RATE_LIMITS.api
}

function checkRateLimit(
  key: string,
  config: { requests: number; window: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  // Clean up expired entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(key)
  }

  const currentRecord = rateLimitStore.get(key)

  if (!currentRecord) {
    // First request
    const resetTime = now + config.window * 1000
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: config.requests - 1, resetTime }
  }

  if (currentRecord.count >= config.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentRecord.resetTime,
    }
  }

  // Increment counter
  currentRecord.count++
  return {
    allowed: true,
    remaining: config.requests - currentRecord.count,
    resetTime: currentRecord.resetTime,
  }
}

// ============================================================================
// Security Helpers
// ============================================================================

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Additional runtime security headers
  response.headers.set('X-Request-Id', crypto.randomUUID())
  return response
}

// ============================================================================
// Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIP(request)

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next()
  }

  // ============================================================================
  // Rate Limiting for API Routes
  // ============================================================================
  if (pathname.startsWith('/api')) {
    // Get user session for premium rate limits
    const token = await getToken({ req: request })
    const isPremium = token?.subscriptionPlan === 'PREMIUM' || token?.subscriptionPlan === 'PREMIUM_PLUS'

    const rateLimitKey = getRateLimitKey(ip, pathname)
    const rateLimitConfig = getRateLimitConfig(pathname, isPremium)
    const { allowed, remaining, resetTime } = checkRateLimit(rateLimitKey, rateLimitConfig)

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      return new NextResponse(
        JSON.stringify({
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateLimitConfig.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
          },
        }
      )
    }

    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', rateLimitConfig.requests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
    return addSecurityHeaders(response)
  }

  // ============================================================================
  // Authentication Check for Protected Routes
  // ============================================================================
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname)

  if (isProtectedRoute) {
    const token = await getToken({ req: request })

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && pathname !== '/') {
    const token = await getToken({ req: request })
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return addSecurityHeaders(NextResponse.next())
}

// ============================================================================
// Matcher Configuration
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
