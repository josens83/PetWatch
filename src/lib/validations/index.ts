/**
 * Validation Schemas Index
 * Re-export all validation schemas
 */

// User validations
export * from './user'

// Pet validations
export * from './pet'

// Health log validations
export * from './health-log'

// Common validation utilities
import { z, ZodError, ZodSchema } from 'zod'
import { ValidationError } from '../errors'

/**
 * Validate data against a Zod schema
 * @throws ValidationError if validation fails
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {}

      for (const issue of error.errors) {
        const path = issue.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(issue.message)
      }

      throw new ValidationError('입력 데이터가 올바르지 않습니다.', errors)
    }
    throw error
  }
}

/**
 * Safe validate - returns result object instead of throwing
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string[]> = {}
  for (const issue of result.error.errors) {
    const path = issue.path.join('.') || '_root'
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(issue.message)
  }

  return { success: false, errors }
}

/**
 * Validate request body in API routes
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new ValidationError('올바른 JSON 형식이 아닙니다.')
  }

  return validate(schema, body)
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T {
  const params: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  return validate(schema, params)
}

// Re-export Zod for convenience
export { z, ZodError } from 'zod'
export type { ZodSchema } from 'zod'
