/**
 * Edge Case Handling Utilities
 * 엣지 케이스 처리 유틸리티
 *
 * @description
 * 이 모듈은 다양한 엣지 케이스를 안전하게 처리하기 위한 유틸리티 함수들을 제공합니다.
 * 빈 값, 경계값, 잘못된 입력 등을 일관되게 처리합니다.
 *
 * @module edge-cases
 * @version 1.0.0
 */

// ============================================================================
// Null/Undefined Handling
// ============================================================================

/**
 * 값이 null 또는 undefined인지 확인
 *
 * @param value - 확인할 값
 * @returns null 또는 undefined이면 true
 *
 * @example
 * ```typescript
 * isNullish(null)      // true
 * isNullish(undefined) // true
 * isNullish(0)         // false
 * isNullish('')        // false
 * ```
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * null/undefined일 경우 기본값 반환
 *
 * @param value - 확인할 값
 * @param defaultValue - 기본값
 * @returns 원본값 또는 기본값
 *
 * @example
 * ```typescript
 * coalesce(null, 'default')      // 'default'
 * coalesce('value', 'default')   // 'value'
 * coalesce(0, 10)                // 0
 * ```
 */
export function coalesce<T>(value: T | null | undefined, defaultValue: T): T {
  return isNullish(value) ? defaultValue : value
}

/**
 * 안전하게 중첩 속성 접근
 *
 * @param obj - 대상 객체
 * @param path - 점 표기법 경로
 * @param defaultValue - 기본값
 * @returns 속성값 또는 기본값
 *
 * @example
 * ```typescript
 * const obj = { user: { name: 'John' } }
 * safeGet(obj, 'user.name')        // 'John'
 * safeGet(obj, 'user.age', 0)      // 0
 * safeGet(obj, 'user.address.city', 'Unknown') // 'Unknown'
 * ```
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let result: unknown = obj

  for (const key of keys) {
    if (isNullish(result) || typeof result !== 'object') {
      return defaultValue
    }
    result = (result as Record<string, unknown>)[key]
  }

  return isNullish(result) ? defaultValue : (result as T)
}

// ============================================================================
// String Handling
// ============================================================================

/**
 * 문자열이 비어있는지 확인 (null, undefined, 빈 문자열, 공백만 있는 경우)
 *
 * @param value - 확인할 값
 * @returns 비어있으면 true
 *
 * @example
 * ```typescript
 * isEmptyString(null)      // true
 * isEmptyString('')        // true
 * isEmptyString('   ')     // true
 * isEmptyString('hello')   // false
 * ```
 */
export function isEmptyString(value: unknown): boolean {
  if (isNullish(value)) return true
  if (typeof value !== 'string') return true
  return value.trim().length === 0
}

/**
 * 문자열 안전하게 트림
 *
 * @param value - 트림할 값
 * @param defaultValue - 기본값
 * @returns 트림된 문자열 또는 기본값
 */
export function safeTrim(value: unknown, defaultValue = ''): string {
  if (isNullish(value)) return defaultValue
  if (typeof value !== 'string') return defaultValue
  return value.trim()
}

/**
 * 문자열 안전하게 자르기
 *
 * @param value - 자를 문자열
 * @param maxLength - 최대 길이
 * @param suffix - 접미사 (기본: '...')
 * @returns 잘린 문자열
 *
 * @example
 * ```typescript
 * truncate('Hello World', 5)     // 'Hello...'
 * truncate('Hi', 10)             // 'Hi'
 * truncate(null, 10)             // ''
 * ```
 */
export function truncate(
  value: unknown,
  maxLength: number,
  suffix = '...'
): string {
  const str = safeTrim(value)
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length) + suffix
}

// ============================================================================
// Number Handling
// ============================================================================

/**
 * 안전하게 숫자로 변환
 *
 * @param value - 변환할 값
 * @param defaultValue - 기본값 (기본: 0)
 * @returns 변환된 숫자 또는 기본값
 *
 * @example
 * ```typescript
 * safeNumber('123')        // 123
 * safeNumber('abc')        // 0
 * safeNumber(null, 10)     // 10
 * safeNumber(NaN, 5)       // 5
 * ```
 */
export function safeNumber(value: unknown, defaultValue = 0): number {
  if (isNullish(value)) return defaultValue
  if (typeof value === 'number') {
    return Number.isNaN(value) || !Number.isFinite(value) ? defaultValue : value
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) || !Number.isFinite(parsed) ? defaultValue : parsed
}

/**
 * 숫자를 범위 내로 제한
 *
 * @param value - 제한할 값
 * @param min - 최소값
 * @param max - 최대값
 * @returns 범위 내 값
 *
 * @example
 * ```typescript
 * clamp(5, 0, 10)   // 5
 * clamp(-5, 0, 10)  // 0
 * clamp(15, 0, 10)  // 10
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 안전하게 정수로 변환
 *
 * @param value - 변환할 값
 * @param defaultValue - 기본값 (기본: 0)
 * @returns 변환된 정수 또는 기본값
 */
export function safeInteger(value: unknown, defaultValue = 0): number {
  const num = safeNumber(value, defaultValue)
  return Math.trunc(num)
}

/**
 * 양수만 허용
 *
 * @param value - 확인할 값
 * @param defaultValue - 기본값
 * @returns 양수 또는 기본값
 */
export function positiveNumber(value: unknown, defaultValue = 0): number {
  const num = safeNumber(value, defaultValue)
  return num > 0 ? num : defaultValue
}

// ============================================================================
// Array Handling
// ============================================================================

/**
 * 배열이 비어있는지 확인
 *
 * @param value - 확인할 값
 * @returns 배열이 아니거나 비어있으면 true
 *
 * @example
 * ```typescript
 * isEmptyArray(null)       // true
 * isEmptyArray([])         // true
 * isEmptyArray([1, 2, 3])  // false
 * ```
 */
export function isEmptyArray(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0
}

/**
 * 안전하게 배열로 변환
 *
 * @param value - 변환할 값
 * @returns 배열
 *
 * @example
 * ```typescript
 * ensureArray(null)        // []
 * ensureArray([1, 2])      // [1, 2]
 * ensureArray('hello')     // ['hello']
 * ```
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (isNullish(value)) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * 배열의 첫 번째 요소 안전하게 가져오기
 *
 * @param arr - 대상 배열
 * @param defaultValue - 기본값
 * @returns 첫 번째 요소 또는 기본값
 */
export function safeFirst<T>(
  arr: T[] | null | undefined,
  defaultValue?: T
): T | undefined {
  if (isEmptyArray(arr)) return defaultValue
  return arr![0]
}

/**
 * 배열의 마지막 요소 안전하게 가져오기
 *
 * @param arr - 대상 배열
 * @param defaultValue - 기본값
 * @returns 마지막 요소 또는 기본값
 */
export function safeLast<T>(
  arr: T[] | null | undefined,
  defaultValue?: T
): T | undefined {
  if (isEmptyArray(arr)) return defaultValue
  return arr![arr!.length - 1]
}

/**
 * 배열 요소 안전하게 접근
 *
 * @param arr - 대상 배열
 * @param index - 인덱스
 * @param defaultValue - 기본값
 * @returns 해당 요소 또는 기본값
 */
export function safeAt<T>(
  arr: T[] | null | undefined,
  index: number,
  defaultValue?: T
): T | undefined {
  if (isEmptyArray(arr)) return defaultValue
  const normalizedIndex = index < 0 ? arr!.length + index : index
  if (normalizedIndex < 0 || normalizedIndex >= arr!.length) return defaultValue
  return arr![normalizedIndex]
}

/**
 * 배열에서 null/undefined 제거
 *
 * @param arr - 대상 배열
 * @returns 필터된 배열
 */
export function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((item): item is T => !isNullish(item))
}

/**
 * 배열 중복 제거
 *
 * @param arr - 대상 배열
 * @param keyFn - 키 추출 함수 (선택)
 * @returns 중복 제거된 배열
 *
 * @example
 * ```typescript
 * unique([1, 2, 2, 3])  // [1, 2, 3]
 * unique([{id: 1}, {id: 1}, {id: 2}], x => x.id)  // [{id: 1}, {id: 2}]
 * ```
 */
export function unique<T>(arr: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) return [...new Set(arr)]

  const seen = new Set<unknown>()
  return arr.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ============================================================================
// Object Handling
// ============================================================================

/**
 * 객체가 비어있는지 확인
 *
 * @param value - 확인할 값
 * @returns 객체가 아니거나 비어있으면 true
 */
export function isEmptyObject(value: unknown): boolean {
  if (isNullish(value)) return true
  if (typeof value !== 'object') return true
  return Object.keys(value as object).length === 0
}

/**
 * 객체에서 null/undefined 값 제거
 *
 * @param obj - 대상 객체
 * @returns 정리된 객체
 *
 * @example
 * ```typescript
 * omitNullish({ a: 1, b: null, c: undefined })
 * // { a: 1 }
 * ```
 */
export function omitNullish<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Partial<T> = {}
  for (const key in obj) {
    if (!isNullish(obj[key])) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * 객체 속성 안전하게 선택
 *
 * @param obj - 대상 객체
 * @param keys - 선택할 키들
 * @returns 선택된 속성만 포함하는 객체
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T | null | undefined,
  keys: K[]
): Pick<T, K> {
  if (isNullish(obj)) return {} as Pick<T, K>

  const result: Partial<T> = {}
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result as Pick<T, K>
}

/**
 * 객체 속성 안전하게 제외
 *
 * @param obj - 대상 객체
 * @param keys - 제외할 키들
 * @returns 제외된 속성 없는 객체
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T | null | undefined,
  keys: K[]
): Omit<T, K> {
  if (isNullish(obj)) return {} as Omit<T, K>

  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result as Omit<T, K>
}

// ============================================================================
// Date Handling
// ============================================================================

/**
 * 유효한 Date 객체인지 확인
 *
 * @param value - 확인할 값
 * @returns 유효한 Date이면 true
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * 안전하게 Date로 변환
 *
 * @param value - 변환할 값
 * @param defaultValue - 기본값
 * @returns Date 객체 또는 기본값
 *
 * @example
 * ```typescript
 * safeDate('2024-01-01')           // Date object
 * safeDate('invalid')              // new Date()
 * safeDate(null, new Date(0))      // Date(0)
 * ```
 */
export function safeDate(
  value: unknown,
  defaultValue: Date = new Date()
): Date {
  if (isNullish(value)) return defaultValue
  if (isValidDate(value)) return value

  const parsed = new Date(value as string | number)
  return isValidDate(parsed) ? parsed : defaultValue
}

/**
 * 날짜가 범위 내인지 확인
 *
 * @param date - 확인할 날짜
 * @param start - 시작 날짜
 * @param end - 종료 날짜
 * @returns 범위 내이면 true
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  if (!isValidDate(date) || !isValidDate(start) || !isValidDate(end)) {
    return false
  }
  const time = date.getTime()
  return time >= start.getTime() && time <= end.getTime()
}

// ============================================================================
// Type Checking
// ============================================================================

/**
 * 값이 plain object인지 확인
 *
 * @param value - 확인할 값
 * @returns plain object이면 true
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (isNullish(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * 값이 Promise인지 확인
 *
 * @param value - 확인할 값
 * @returns Promise이면 true
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isPlainObject(value) &&
      typeof (value as Promise<T>).then === 'function' &&
      typeof (value as Promise<T>).catch === 'function')
  )
}

/**
 * 값이 함수인지 확인
 *
 * @param value - 확인할 값
 * @returns 함수이면 true
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * 에러 메시지 안전하게 추출
 *
 * @param error - 에러 객체
 * @param defaultMessage - 기본 메시지
 * @returns 에러 메시지
 *
 * @example
 * ```typescript
 * getErrorMessage(new Error('failed'))   // 'failed'
 * getErrorMessage('string error')        // 'string error'
 * getErrorMessage({ message: 'obj' })    // 'obj'
 * getErrorMessage(null)                  // 'Unknown error'
 * ```
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = 'Unknown error'
): string {
  if (isNullish(error)) return defaultMessage

  if (error instanceof Error) return error.message

  if (typeof error === 'string') return error

  if (
    isPlainObject(error) &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return defaultMessage
}

/**
 * 안전하게 비동기 함수 실행
 *
 * @param fn - 실행할 함수
 * @param defaultValue - 에러 시 반환할 기본값
 * @returns 실행 결과 또는 기본값
 *
 * @example
 * ```typescript
 * const result = await safeAsync(
 *   () => fetch('/api/data'),
 *   null
 * )
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await fn()
  } catch {
    return defaultValue
  }
}

/**
 * 안전하게 동기 함수 실행
 *
 * @param fn - 실행할 함수
 * @param defaultValue - 에러 시 반환할 기본값
 * @returns 실행 결과 또는 기본값
 */
export function safeSync<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn()
  } catch {
    return defaultValue
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * 이메일 형식 검증
 *
 * @param email - 검증할 이메일
 * @returns 유효한 형식이면 true
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * URL 형식 검증
 *
 * @param url - 검증할 URL
 * @returns 유효한 형식이면 true
 */
export function isValidUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * UUID 형식 검증
 *
 * @param uuid - 검증할 UUID
 * @returns 유효한 UUID이면 true
 */
export function isValidUuid(uuid: unknown): boolean {
  if (typeof uuid !== 'string') return false
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * 한국 전화번호 형식 검증
 *
 * @param phone - 검증할 전화번호
 * @returns 유효한 형식이면 true
 */
export function isValidKoreanPhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false
  const cleaned = phone.replace(/[-\s]/g, '')
  const phoneRegex = /^(01[016789])(\d{3,4})(\d{4})$/
  return phoneRegex.test(cleaned)
}

// ============================================================================
// Retry Utilities
// ============================================================================

/**
 * 재시도 옵션
 */
interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number) => void
}

/**
 * 지수 백오프로 재시도
 *
 * @param fn - 실행할 함수
 * @param options - 재시도 옵션
 * @returns 함수 실행 결과
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   { maxRetries: 3, baseDelay: 1000 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error
      }

      onRetry?.(error, attempt)

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ============================================================================
// Debounce/Throttle
// ============================================================================

/**
 * 함수 디바운스
 *
 * @param fn - 디바운스할 함수
 * @param delay - 지연 시간 (ms)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 함수 스로틀
 *
 * @param fn - 스로틀할 함수
 * @param limit - 제한 시간 (ms)
 * @returns 스로틀된 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
