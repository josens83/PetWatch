/**
 * API Route Utilities
 * Production-grade API helpers for Next.js App Router
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ZodSchema, ZodError } from 'zod'
import { authOptions } from './auth'
import { prisma } from './db'
import { logger } from './logger'
import { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError } from './errors'
import { captureException } from './sentry'

// ============================================================================
// Types
// ============================================================================

interface Session {
  user: {
    id: string
    email: string
    name?: string
  }
}

interface ApiContext {
  session: Session
  userId: string
  isPremium: boolean
  requestId: string
}

type ApiHandler<T = unknown> = (
  request: Request,
  context: ApiContext
) => Promise<T>

interface ApiOptions {
  requireAuth?: boolean
  requirePremium?: boolean
  rateLimit?: { requests: number; window: number }
}

// ============================================================================
// Response Helpers
// ============================================================================

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 })
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  errors?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: code || `HTTP_${status}`,
      ...(errors && { errors }),
    },
    { status }
  )
}

// ============================================================================
// Error Handler
// ============================================================================

export function handleApiError(error: unknown, requestId?: string): NextResponse {
  // Log the error
  logger.error('API Error', error instanceof Error ? error : undefined, { requestId })

  // Handle known error types
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        errors: error.errors,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof AppError) {
    // Report non-operational errors to Sentry
    if (!error.isOperational) {
      captureException(error, {
        extra: { requestId },
      })
    }

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {}
    error.errors.forEach((e) => {
      const path = e.path.join('.') || '_root'
      if (!errors[path]) errors[path] = []
      errors[path].push(e.message)
    })

    return NextResponse.json(
      {
        error: '입력 데이터가 올바르지 않습니다.',
        code: 'VALIDATION_ERROR',
        errors,
      },
      { status: 422 }
    )
  }

  // Prisma errors
  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as { code: string }
    switch (prismaError.code) {
      case 'P2002':
        return errorResponse('이미 존재하는 데이터입니다.', 409, 'DUPLICATE_ENTRY')
      case 'P2025':
        return errorResponse('데이터를 찾을 수 없습니다.', 404, 'NOT_FOUND')
      default:
        captureException(error, { extra: { requestId } })
        return errorResponse('데이터베이스 오류가 발생했습니다.', 500, 'DATABASE_ERROR')
    }
  }

  // Unknown errors
  captureException(error, { extra: { requestId } })
  return errorResponse('서버 오류가 발생했습니다.', 500, 'INTERNAL_SERVER_ERROR')
}

// ============================================================================
// Validation Helpers
// ============================================================================

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new ValidationError('올바른 JSON 형식이 아닙니다.')
  }

  return schema.parse(body)
}

export function parseQuery<T>(url: string, schema: ZodSchema<T>): T {
  const { searchParams } = new URL(url)
  const params: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  return schema.parse(params)
}

// ============================================================================
// Auth Helpers
// ============================================================================

export async function requireAuth(): Promise<ApiContext> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new AuthenticationError('로그인이 필요합니다.')
  }

  // Get subscription status
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const isPremium =
    subscription?.status === 'ACTIVE' &&
    (subscription.plan === 'PREMIUM' || subscription.plan === 'PREMIUM_PLUS')

  return {
    session: session as Session,
    userId: session.user.id,
    isPremium,
    requestId: crypto.randomUUID(),
  }
}

export async function optionalAuth(): Promise<ApiContext | null> {
  try {
    return await requireAuth()
  } catch {
    return null
  }
}

// ============================================================================
// Resource Ownership Helpers
// ============================================================================

export async function requirePetOwnership(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { ownerId: true },
  })

  if (!pet) {
    throw new NotFoundError('반려동물')
  }

  if (pet.ownerId !== userId) {
    throw new AuthorizationError('이 반려동물에 대한 접근 권한이 없습니다.')
  }
}

export async function getPetWithOwnershipCheck(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
  })

  if (!pet) {
    throw new NotFoundError('반려동물')
  }

  if (pet.ownerId !== userId) {
    throw new AuthorizationError('이 반려동물에 대한 접근 권한이 없습니다.')
  }

  return pet
}

// ============================================================================
// Subscription Helpers
// ============================================================================

export async function checkPetLimit(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const existingCount = await prisma.pet.count({
    where: { ownerId: userId },
  })

  const limits = {
    FREE: 1,
    PREMIUM: 5,
    PREMIUM_PLUS: 10,
  }

  const plan = subscription?.plan || 'FREE'
  const limit = limits[plan]

  if (existingCount >= limit) {
    throw new AppError(
      `${plan === 'FREE' ? '무료' : '현재'} 플랜에서는 최대 ${limit}마리까지 등록할 수 있습니다.`,
      'PET_LIMIT_EXCEEDED',
      403
    )
  }
}

export async function requirePremium(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const isPremium =
    subscription?.status === 'ACTIVE' &&
    (subscription.plan === 'PREMIUM' || subscription.plan === 'PREMIUM_PLUS')

  if (!isPremium) {
    throw new AppError(
      '이 기능은 프리미엄 구독자만 사용할 수 있습니다.',
      'SUBSCRIPTION_REQUIRED',
      403
    )
  }
}

// ============================================================================
// API Route Wrapper
// ============================================================================

export function createApiHandler<T>(
  handler: ApiHandler<T>,
  options: ApiOptions = {}
) {
  return async (request: Request): Promise<NextResponse> => {
    const requestId = crypto.randomUUID()

    try {
      // Authentication
      let context: ApiContext

      if (options.requireAuth !== false) {
        context = await requireAuth()
      } else {
        const optContext = await optionalAuth()
        context = optContext || {
          session: null as unknown as Session,
          userId: '',
          isPremium: false,
          requestId,
        }
      }

      context.requestId = requestId

      // Premium check
      if (options.requirePremium && !context.isPremium) {
        throw new AppError(
          '이 기능은 프리미엄 구독자만 사용할 수 있습니다.',
          'SUBSCRIPTION_REQUIRED',
          403
        )
      }

      // Execute handler
      const result = await handler(request, context)

      // Return response
      if (result instanceof NextResponse) {
        return result
      }

      return successResponse(result)
    } catch (error) {
      return handleApiError(error, requestId)
    }
  }
}

// ============================================================================
// Pagination Helpers
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export function parsePagination(url: string, defaultLimit: number = 20): PaginationParams {
  const { searchParams } = new URL(url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10)))

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  }
}
