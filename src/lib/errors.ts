/**
 * Custom Error Classes for PetWatch
 * Netflix-level error handling with proper classification
 */

// Base application error
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    }
  }
}

// Network-related errors
export class NetworkError extends AppError {
  constructor(message: string = '네트워크 연결에 실패했습니다.', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 0, true, context)
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = '요청 시간이 초과되었습니다.', context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, true, context)
  }
}

// HTTP errors
export class HttpError extends AppError {
  constructor(
    statusCode: number,
    message?: string,
    code?: string,
    context?: Record<string, unknown>
  ) {
    const defaultMessage = HttpError.getDefaultMessage(statusCode)
    super(message || defaultMessage, code || `HTTP_${statusCode}`, statusCode, true, context)
  }

  static getDefaultMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: '잘못된 요청입니다.',
      401: '로그인이 필요합니다.',
      403: '접근 권한이 없습니다.',
      404: '요청한 리소스를 찾을 수 없습니다.',
      409: '이미 존재하는 데이터입니다.',
      422: '입력 데이터가 올바르지 않습니다.',
      429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      500: '서버 오류가 발생했습니다.',
      502: '서버가 응답하지 않습니다.',
      503: '서비스를 일시적으로 사용할 수 없습니다.',
      504: '서버 응답 시간이 초과되었습니다.',
    }
    return messages[statusCode] || '알 수 없는 오류가 발생했습니다.'
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string = '인증에 실패했습니다.', context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '접근 권한이 없습니다.', context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context)
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>

  constructor(
    message: string = '입력 데이터가 올바르지 않습니다.',
    errors: Record<string, string[]> = {},
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 422, true, context)
    this.errors = errors
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    }
  }
}

// Business logic errors
export class BusinessError extends AppError {
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, 400, true, context)
  }
}

export class SubscriptionError extends BusinessError {
  constructor(message: string = '구독 플랜 업그레이드가 필요합니다.', context?: Record<string, unknown>) {
    super(message, 'SUBSCRIPTION_REQUIRED', context)
  }
}

export class PetLimitError extends BusinessError {
  constructor(message: string = '등록 가능한 반려동물 수를 초과했습니다.', context?: Record<string, unknown>) {
    super(message, 'PET_LIMIT_EXCEEDED', context)
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number

  constructor(retryAfter: number = 60, context?: Record<string, unknown>) {
    super(
      `요청이 너무 많습니다. ${retryAfter}초 후에 다시 시도해주세요.`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true,
      context
    )
    this.retryAfter = retryAfter
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = '데이터베이스 오류가 발생했습니다.', context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, false, context)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = '리소스', context?: Record<string, unknown>) {
    super(`${resource}를 찾을 수 없습니다.`, 'NOT_FOUND', 404, true, context)
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  public readonly service: string

  constructor(service: string, message?: string, context?: Record<string, unknown>) {
    super(
      message || `외부 서비스(${service}) 연결에 실패했습니다.`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      true,
      { ...context, service }
    )
    this.service = service
  }
}

// Circuit breaker errors
export class CircuitOpenError extends AppError {
  constructor(service: string, context?: Record<string, unknown>) {
    super(
      `서비스(${service})가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.`,
      'CIRCUIT_OPEN',
      503,
      true,
      { ...context, service }
    )
  }
}

// Error type guards
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational
  }
  return false
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error) || isTimeoutError(error)) {
    return true
  }
  if (isHttpError(error)) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(error.statusCode)
  }
  return false
}

// Error factory from unknown
export function createErrorFromUnknown(error: unknown): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    // Check for fetch/network errors
    if (error.name === 'AbortError') {
      return new TimeoutError('요청이 취소되었습니다.')
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError('네트워크 연결에 실패했습니다.')
    }
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, false)
  }

  if (typeof error === 'string') {
    return new AppError(error, 'UNKNOWN_ERROR', 500, false)
  }

  return new AppError('알 수 없는 오류가 발생했습니다.', 'UNKNOWN_ERROR', 500, false)
}
