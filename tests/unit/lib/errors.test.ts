/**
 * Error Classes Tests
 */

import {
  AppError,
  HttpError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  isAppError,
  isRetryableError,
  createErrorFromUnknown,
} from '@/lib/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400, true, { foo: 'bar' })

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error.context).toEqual({ foo: 'bar' })
    })

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400, true, { foo: 'bar' })
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'AppError',
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400,
        context: { foo: 'bar' },
      })
    })
  })

  describe('HttpError', () => {
    it('should create error with default message for status code', () => {
      const error = new HttpError(404)

      expect(error.message).toBe('요청한 리소스를 찾을 수 없습니다.')
      expect(error.code).toBe('HTTP_404')
      expect(error.statusCode).toBe(404)
    })

    it('should use custom message when provided', () => {
      const error = new HttpError(404, '사용자를 찾을 수 없습니다.')

      expect(error.message).toBe('사용자를 찾을 수 없습니다.')
    })
  })

  describe('ValidationError', () => {
    it('should include field errors', () => {
      const errors = {
        email: ['유효한 이메일을 입력하세요'],
        password: ['비밀번호는 8자 이상이어야 합니다'],
      }
      const error = new ValidationError('입력 오류', errors)

      expect(error.errors).toEqual(errors)
      expect(error.statusCode).toBe(422)
    })
  })

  describe('AuthenticationError', () => {
    it('should have correct status code', () => {
      const error = new AuthenticationError()

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('AuthorizationError', () => {
    it('should have correct status code', () => {
      const error = new AuthorizationError()

      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('NotFoundError', () => {
    it('should include resource name in message', () => {
      const error = new NotFoundError('반려동물')

      expect(error.message).toBe('반려동물를 찾을 수 없습니다.')
      expect(error.statusCode).toBe(404)
    })
  })

  describe('RateLimitError', () => {
    it('should include retry after', () => {
      const error = new RateLimitError(60)

      expect(error.retryAfter).toBe(60)
      expect(error.statusCode).toBe(429)
    })
  })
})

describe('Error Type Guards', () => {
  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      expect(isAppError(new AppError('test', 'TEST'))).toBe(true)
      expect(isAppError(new HttpError(404))).toBe(true)
      expect(isAppError(new ValidationError('test'))).toBe(true)
    })

    it('should return false for non-AppError', () => {
      expect(isAppError(new Error('test'))).toBe(false)
      expect(isAppError('string')).toBe(false)
      expect(isAppError(null)).toBe(false)
    })
  })

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      expect(isRetryableError(new NetworkError())).toBe(true)
    })

    it('should return true for timeout errors', () => {
      expect(isRetryableError(new TimeoutError())).toBe(true)
    })

    it('should return true for retryable HTTP status codes', () => {
      expect(isRetryableError(new HttpError(500))).toBe(true)
      expect(isRetryableError(new HttpError(502))).toBe(true)
      expect(isRetryableError(new HttpError(503))).toBe(true)
      expect(isRetryableError(new HttpError(504))).toBe(true)
      expect(isRetryableError(new HttpError(429))).toBe(true)
    })

    it('should return false for client errors', () => {
      expect(isRetryableError(new HttpError(400))).toBe(false)
      expect(isRetryableError(new HttpError(401))).toBe(false)
      expect(isRetryableError(new HttpError(403))).toBe(false)
      expect(isRetryableError(new HttpError(404))).toBe(false)
    })
  })
})

describe('createErrorFromUnknown', () => {
  it('should return AppError as-is', () => {
    const original = new HttpError(404)
    const result = createErrorFromUnknown(original)

    expect(result).toBe(original)
  })

  it('should convert Error to AppError', () => {
    const result = createErrorFromUnknown(new Error('Test error'))

    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('Test error')
  })

  it('should convert string to AppError', () => {
    const result = createErrorFromUnknown('String error')

    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('String error')
  })

  it('should handle unknown types', () => {
    const result = createErrorFromUnknown(null)

    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe('UNKNOWN_ERROR')
  })
})
