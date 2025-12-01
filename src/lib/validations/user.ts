/**
 * User Validation Schemas
 */

import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 100
const NAME_MAX_LENGTH = 50
const PHONE_REGEX = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/

// ============================================================================
// Schemas
// ============================================================================

export const emailSchema = z
  .string({ required_error: '이메일을 입력해주세요.' })
  .min(1, '이메일을 입력해주세요.')
  .email('올바른 이메일 형식이 아닙니다.')
  .max(255, '이메일이 너무 깁니다.')

export const passwordSchema = z
  .string({ required_error: '비밀번호를 입력해주세요.' })
  .min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
  .max(PASSWORD_MAX_LENGTH, `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`)
  .regex(/[a-zA-Z]/, '비밀번호에 영문자를 포함해주세요.')
  .regex(/[0-9]/, '비밀번호에 숫자를 포함해주세요.')

export const nameSchema = z
  .string({ required_error: '이름을 입력해주세요.' })
  .min(1, '이름을 입력해주세요.')
  .max(NAME_MAX_LENGTH, `이름은 ${NAME_MAX_LENGTH}자 이하여야 합니다.`)
  .trim()

export const phoneSchema = z
  .string()
  .regex(PHONE_REGEX, '올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)')
  .optional()
  .nullable()

// ============================================================================
// Form Schemas
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: '비밀번호를 입력해주세요.' }).min(1, '비밀번호를 입력해주세요.'),
})

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: '비밀번호 확인을 입력해주세요.' }),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: '서비스 이용약관에 동의해주세요.',
    }),
    agreeToPrivacy: z.boolean().refine((val) => val === true, {
      message: '개인정보 처리방침에 동의해주세요.',
    }),
    agreeToMarketing: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  image: z.string().url('올바른 URL 형식이 아닙니다.').optional().nullable(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: '현재 비밀번호를 입력해주세요.' }).min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string({ required_error: '새 비밀번호 확인을 입력해주세요.' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '현재 비밀번호와 다른 비밀번호를 입력해주세요.',
    path: ['newPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: passwordSchema,
    confirmPassword: z.string({ required_error: '비밀번호 확인을 입력해주세요.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })

// ============================================================================
// Types
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
