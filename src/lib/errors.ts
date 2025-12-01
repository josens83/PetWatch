/**
 * Custom Error Classes for PetWatch
 * Netflix-level error handling with proper classification
 *
 * @description
 * 이 모듈은 애플리케이션 전반에서 사용되는 커스텀 에러 클래스들을 제공합니다.
 * Netflix의 에러 분류 체계를 참고하여 운영 에러(Operational)와 프로그래밍 에러를
 * 구분하고, 적절한 재시도 로직과 사용자 친화적 메시지를 제공합니다.
 *
 * @module errors
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import { ValidationError, isRetryableError } from '@/lib/errors'
 *
 * try {
 *   throw new ValidationError('이메일 형식이 올바르지 않습니다.', {
 *     email: ['유효한 이메일 주소를 입력해주세요.']
 *   })
 * } catch (error) {
 *   if (isRetryableError(error)) {
 *     // 재시도 로직
 *   }
 * }
 * ```
 */

// ============================================================================
// Base Application Error
// ============================================================================

/**
 * 애플리케이션 기본 에러 클래스
 *
 * @description
 * 모든 커스텀 에러의 기본이 되는 클래스입니다.
 * 에러 코드, HTTP 상태 코드, 운영 에러 여부 등을 포함합니다.
 *
 * @extends Error
 *
 * @property {string} code - 에러 식별 코드 (예: 'VALIDATION_ERROR')
 * @property {number} statusCode - HTTP 상태 코드
 * @property {boolean} isOperational - 운영 에러 여부 (true: 예상된 에러, false: 프로그래밍 에러)
 * @property {Record<string, unknown>} [context] - 추가 컨텍스트 정보
 *
 * @example
 * ```typescript
 * throw new AppError(
 *   '사용자를 찾을 수 없습니다.',
 *   'USER_NOT_FOUND',
 *   404,
 *   true,
 *   { userId: '123' }
 * )
 * ```
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  /**
   * AppError 생성자
   *
   * @param {string} message - 사용자에게 표시할 에러 메시지
   * @param {string} code - 에러 식별 코드
   * @param {number} [statusCode=500] - HTTP 상태 코드
   * @param {boolean} [isOperational=true] - 운영 에러 여부
   * @param {Record<string, unknown>} [context] - 추가 컨텍스트
   */
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

  /**
   * 에러를 JSON으로 직렬화
   *
   * @returns {Object} JSON 직렬화된 에러 객체
   */
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

// ============================================================================
// Network Errors
// ============================================================================

/**
 * 네트워크 연결 에러
 *
 * @description
 * 네트워크 연결 실패, DNS 해석 실패 등의 에러를 나타냅니다.
 * 재시도 가능한 에러로 분류됩니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * if (!navigator.onLine) {
 *   throw new NetworkError('인터넷 연결이 끊어졌습니다.')
 * }
 * ```
 */
export class NetworkError extends AppError {
  constructor(message: string = '네트워크 연결에 실패했습니다.', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 0, true, context)
  }
}

/**
 * 요청 타임아웃 에러
 *
 * @description
 * 요청이 지정된 시간 내에 완료되지 않았을 때 발생합니다.
 * 재시도 가능한 에러로 분류됩니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * const controller = new AbortController()
 * setTimeout(() => controller.abort(), 5000)
 *
 * try {
 *   await fetch(url, { signal: controller.signal })
 * } catch (error) {
 *   throw new TimeoutError('API 요청 시간이 초과되었습니다.')
 * }
 * ```
 */
export class TimeoutError extends AppError {
  constructor(message: string = '요청 시간이 초과되었습니다.', context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, true, context)
  }
}

// ============================================================================
// HTTP Errors
// ============================================================================

/**
 * HTTP 에러
 *
 * @description
 * HTTP 요청 실패 시 발생하는 일반적인 에러입니다.
 * 상태 코드에 따라 적절한 기본 메시지를 제공합니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/users')
 * if (!response.ok) {
 *   throw new HttpError(response.status, '사용자 정보를 가져올 수 없습니다.')
 * }
 * ```
 */
export class HttpError extends AppError {
  /**
   * HttpError 생성자
   *
   * @param {number} statusCode - HTTP 상태 코드
   * @param {string} [message] - 에러 메시지 (없으면 기본 메시지 사용)
   * @param {string} [code] - 에러 코드 (없으면 HTTP_{statusCode} 형태)
   * @param {Record<string, unknown>} [context] - 추가 컨텍스트
   */
  constructor(
    statusCode: number,
    message?: string,
    code?: string,
    context?: Record<string, unknown>
  ) {
    const defaultMessage = HttpError.getDefaultMessage(statusCode)
    super(message || defaultMessage, code || `HTTP_${statusCode}`, statusCode, true, context)
  }

  /**
   * HTTP 상태 코드에 해당하는 기본 메시지 반환
   *
   * @static
   * @param {number} statusCode - HTTP 상태 코드
   * @returns {string} 사용자 친화적인 에러 메시지
   */
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

// ============================================================================
// Authentication & Authorization Errors
// ============================================================================

/**
 * 인증 에러
 *
 * @description
 * 사용자 인증에 실패했을 때 발생합니다.
 * 로그인이 필요하거나 토큰이 만료된 경우에 사용됩니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * const session = await getServerSession()
 * if (!session) {
 *   throw new AuthenticationError('로그인이 필요합니다.')
 * }
 * ```
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '인증에 실패했습니다.', context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context)
  }
}

/**
 * 권한 부족 에러
 *
 * @description
 * 인증은 되었지만 특정 리소스에 대한 접근 권한이 없을 때 발생합니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * if (pet.ownerId !== currentUserId) {
 *   throw new AuthorizationError('이 반려동물에 대한 접근 권한이 없습니다.')
 * }
 * ```
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '접근 권한이 없습니다.', context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context)
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * 입력 검증 에러
 *
 * @description
 * 사용자 입력이 유효성 검사를 통과하지 못했을 때 발생합니다.
 * 필드별 에러 메시지를 포함하여 사용자에게 상세한 피드백을 제공합니다.
 *
 * @extends AppError
 *
 * @property {Record<string, string[]>} errors - 필드별 에러 메시지 배열
 *
 * @example
 * ```typescript
 * throw new ValidationError('입력 데이터가 올바르지 않습니다.', {
 *   email: ['유효한 이메일 주소를 입력해주세요.'],
 *   password: [
 *     '비밀번호는 8자 이상이어야 합니다.',
 *     '비밀번호에 특수문자를 포함해주세요.'
 *   ]
 * })
 * ```
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>

  /**
   * ValidationError 생성자
   *
   * @param {string} [message='입력 데이터가 올바르지 않습니다.'] - 에러 메시지
   * @param {Record<string, string[]>} [errors={}] - 필드별 에러 메시지
   * @param {Record<string, unknown>} [context] - 추가 컨텍스트
   */
  constructor(
    message: string = '입력 데이터가 올바르지 않습니다.',
    errors: Record<string, string[]> = {},
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 422, true, context)
    this.errors = errors
  }

  /**
   * @override
   */
  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    }
  }
}

// ============================================================================
// Business Logic Errors
// ============================================================================

/**
 * 비즈니스 로직 에러
 *
 * @description
 * 비즈니스 규칙 위반 시 발생하는 기본 에러 클래스입니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * throw new BusinessError(
 *   '이미 예약이 완료된 시간입니다.',
 *   'BOOKING_CONFLICT'
 * )
 * ```
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, 400, true, context)
  }
}

/**
 * 구독 필요 에러
 *
 * @description
 * 프리미엄 기능에 접근할 때 적절한 구독이 없는 경우 발생합니다.
 *
 * @extends BusinessError
 *
 * @example
 * ```typescript
 * if (!user.isPremium) {
 *   throw new SubscriptionError('AI 건강 분석은 프리미엄 구독이 필요합니다.')
 * }
 * ```
 */
export class SubscriptionError extends BusinessError {
  constructor(message: string = '구독 플랜 업그레이드가 필요합니다.', context?: Record<string, unknown>) {
    super(message, 'SUBSCRIPTION_REQUIRED', context)
  }
}

/**
 * 반려동물 등록 제한 에러
 *
 * @description
 * 구독 플랜별 반려동물 등록 제한을 초과했을 때 발생합니다.
 *
 * @extends BusinessError
 *
 * @example
 * ```typescript
 * const petCount = await prisma.pet.count({ where: { ownerId } })
 * if (petCount >= limits[plan]) {
 *   throw new PetLimitError()
 * }
 * ```
 */
export class PetLimitError extends BusinessError {
  constructor(message: string = '등록 가능한 반려동물 수를 초과했습니다.', context?: Record<string, unknown>) {
    super(message, 'PET_LIMIT_EXCEEDED', context)
  }
}

/**
 * 요청 제한 초과 에러
 *
 * @description
 * API 요청 제한을 초과했을 때 발생합니다.
 * retryAfter 속성으로 재시도 가능 시간을 제공합니다.
 *
 * @extends AppError
 *
 * @property {number} retryAfter - 재시도 가능까지 남은 시간 (초)
 *
 * @example
 * ```typescript
 * throw new RateLimitError(60) // 60초 후 재시도 가능
 * ```
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number

  /**
   * RateLimitError 생성자
   *
   * @param {number} [retryAfter=60] - 재시도 가능까지 남은 시간 (초)
   * @param {Record<string, unknown>} [context] - 추가 컨텍스트
   */
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

// ============================================================================
// Database Errors
// ============================================================================

/**
 * 데이터베이스 에러
 *
 * @description
 * 데이터베이스 연결 실패, 쿼리 실패 등의 에러입니다.
 * 운영 에러가 아닌 것으로 분류되어 모니터링 알림을 발생시킵니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * try {
 *   await prisma.user.create({ data })
 * } catch (error) {
 *   throw new DatabaseError('사용자 생성에 실패했습니다.')
 * }
 * ```
 */
export class DatabaseError extends AppError {
  constructor(message: string = '데이터베이스 오류가 발생했습니다.', context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, false, context)
  }
}

/**
 * 리소스 없음 에러
 *
 * @description
 * 요청한 리소스를 찾을 수 없을 때 발생합니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * const pet = await prisma.pet.findUnique({ where: { id } })
 * if (!pet) {
 *   throw new NotFoundError('반려동물')
 * }
 * ```
 */
export class NotFoundError extends AppError {
  /**
   * NotFoundError 생성자
   *
   * @param {string} [resource='리소스'] - 찾을 수 없는 리소스 이름
   * @param {Record<string, unknown>} [context] - 추가 컨텍스트
   */
  constructor(resource: string = '리소스', context?: Record<string, unknown>) {
    super(`${resource}를 찾을 수 없습니다.`, 'NOT_FOUND', 404, true, context)
  }
}

// ============================================================================
// External Service Errors
// ============================================================================

/**
 * 외부 서비스 에러
 *
 * @description
 * 외부 API (결제, AI 분석 등) 연동 실패 시 발생합니다.
 *
 * @extends AppError
 *
 * @property {string} service - 실패한 외부 서비스 이름
 *
 * @example
 * ```typescript
 * try {
 *   await openai.chat.completions.create(params)
 * } catch (error) {
 *   throw new ExternalServiceError('OpenAI', 'AI 분석 서비스에 연결할 수 없습니다.')
 * }
 * ```
 */
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

// ============================================================================
// Circuit Breaker Errors
// ============================================================================

/**
 * 서킷 브레이커 오픈 에러
 *
 * @description
 * 서킷 브레이커가 OPEN 상태일 때 요청을 거부하면서 발생합니다.
 * 일정 시간 후 자동으로 HALF_OPEN 상태로 전환되어 재시도됩니다.
 *
 * @extends AppError
 *
 * @example
 * ```typescript
 * const circuit = getCircuitBreaker('payment-service')
 * try {
 *   await circuit.execute(() => processPayment(data))
 * } catch (error) {
 *   if (error instanceof CircuitOpenError) {
 *     // 대체 처리 로직
 *   }
 * }
 * ```
 */
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

// ============================================================================
// Type Guards
// ============================================================================

/**
 * AppError 인스턴스 여부 확인
 *
 * @param {unknown} error - 확인할 에러 객체
 * @returns {boolean} AppError 인스턴스이면 true
 *
 * @example
 * ```typescript
 * if (isAppError(error)) {
 *   console.log(error.code, error.statusCode)
 * }
 * ```
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * 운영 에러 여부 확인
 *
 * @description
 * 운영 에러는 예상된 에러로, 프로그래밍 버그가 아닙니다.
 * 비운영 에러는 모니터링 시스템에 알림을 보내야 합니다.
 *
 * @param {unknown} error - 확인할 에러 객체
 * @returns {boolean} 운영 에러이면 true
 *
 * @example
 * ```typescript
 * if (!isOperationalError(error)) {
 *   Sentry.captureException(error)
 * }
 * ```
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational
  }
  return false
}

/**
 * NetworkError 인스턴스 여부 확인
 *
 * @param {unknown} error - 확인할 에러 객체
 * @returns {boolean} NetworkError 인스턴스이면 true
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

/**
 * TimeoutError 인스턴스 여부 확인
 *
 * @param {unknown} error - 확인할 에러 객체
 * @returns {boolean} TimeoutError 인스턴스이면 true
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}

/**
 * HttpError 인스턴스 여부 확인
 *
 * @param {unknown} error - 확인할 에러 객체
 * @returns {boolean} HttpError 인스턴스이면 true
 */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}

/**
 * ValidationError 인스턴스 여부 확인
 *
 * @param {unknown} error - 확인할 에러 객체
 * @returns {boolean} ValidationError 인스턴스이면 true
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * 재시도 가능한 에러 여부 확인
 *
 * @description
 * 네트워크 에러, 타임아웃, 특정 HTTP 상태 코드(408, 429, 5xx)의 경우
 * 재시도가 의미있는 에러로 분류됩니다.
 *
 * @param {unknown} error - 확인할 에러 객체
 * @returns {boolean} 재시도 가능하면 true
 *
 * @example
 * ```typescript
 * async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
 *   try {
 *     return await fetch(url)
 *   } catch (error) {
 *     if (retries > 0 && isRetryableError(error)) {
 *       await delay(1000)
 *       return fetchWithRetry(url, retries - 1)
 *     }
 *     throw error
 *   }
 * }
 * ```
 */
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

// ============================================================================
// Error Factory
// ============================================================================

/**
 * 알 수 없는 에러를 AppError로 변환
 *
 * @description
 * catch 블록에서 받은 unknown 타입의 에러를 AppError로 변환합니다.
 * 이미 AppError인 경우 그대로 반환하고, 그렇지 않은 경우
 * 적절한 에러 타입을 추론하여 변환합니다.
 *
 * @param {unknown} error - 변환할 에러 객체
 * @returns {AppError} 변환된 AppError 인스턴스
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   const appError = createErrorFromUnknown(error)
 *   logger.error(appError.message, { code: appError.code })
 *   throw appError
 * }
 * ```
 */
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
