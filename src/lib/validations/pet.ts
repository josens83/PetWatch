/**
 * Pet Validation Schemas
 */

import { z } from 'zod'

// ============================================================================
// Enums
// ============================================================================

export const Species = z.enum(['DOG', 'CAT'], {
  errorMap: () => ({ message: '강아지 또는 고양이를 선택해주세요.' }),
})

export const Gender = z.enum(['MALE', 'FEMALE'], {
  errorMap: () => ({ message: '성별을 선택해주세요.' }),
})

export const PetSize = z.enum(['SMALL', 'MEDIUM', 'LARGE', 'GIANT'], {
  errorMap: () => ({ message: '크기를 선택해주세요.' }),
})

export const ActivityLevel = z.enum(['LOW', 'MODERATE', 'HIGH'], {
  errorMap: () => ({ message: '활동량을 선택해주세요.' }),
})

export const DietType = z.enum(['DRY_FOOD', 'WET_FOOD', 'RAW', 'HOMEMADE', 'PRESCRIPTION', 'MIXED'], {
  errorMap: () => ({ message: '사료 종류를 선택해주세요.' }),
})

// ============================================================================
// Schemas
// ============================================================================

export const petNameSchema = z
  .string({ required_error: '반려동물 이름을 입력해주세요.' })
  .min(1, '반려동물 이름을 입력해주세요.')
  .max(20, '이름은 20자 이하로 입력해주세요.')
  .trim()

export const breedSchema = z
  .string({ required_error: '품종을 선택해주세요.' })
  .min(1, '품종을 선택해주세요.')
  .max(50, '품종명이 너무 깁니다.')

export const birthDateSchema = z
  .string({ required_error: '생년월일을 입력해주세요.' })
  .or(z.date())
  .transform((val) => {
    if (typeof val === 'string') {
      const date = new Date(val)
      if (isNaN(date.getTime())) {
        throw new Error('올바른 날짜 형식이 아닙니다.')
      }
      return date
    }
    return val
  })
  .refine((date) => date <= new Date(), {
    message: '생년월일은 오늘 이전이어야 합니다.',
  })
  .refine((date) => date > new Date('1990-01-01'), {
    message: '올바른 생년월일을 입력해주세요.',
  })

export const weightSchema = z
  .number({ required_error: '체중을 입력해주세요.' })
  .or(z.string().transform((val) => parseFloat(val)))
  .refine((val) => !isNaN(val) && val > 0, {
    message: '체중은 0보다 커야 합니다.',
  })
  .refine((val) => val <= 200, {
    message: '체중이 너무 큽니다. 확인해주세요.',
  })

// ============================================================================
// Form Schemas
// ============================================================================

export const createPetSchema = z.object({
  // Basic Info (Step 1)
  species: Species,
  name: petNameSchema,
  breed: breedSchema,
  birthDate: birthDateSchema,
  gender: Gender,

  // Physical Info (Step 2)
  neutered: z.boolean().default(false),
  weight: weightSchema,
  size: PetSize,
  furColor: z.string().max(30, '털 색상은 30자 이하로 입력해주세요.').optional().nullable(),
  distinctiveFeatures: z.string().max(200, '특징은 200자 이하로 입력해주세요.').optional().nullable(),

  // Lifestyle (Step 3)
  activityLevel: ActivityLevel.default('MODERATE'),
  dietType: DietType.default('DRY_FOOD'),
  allergies: z.array(z.string()).default([]),
})

export const updatePetSchema = createPetSchema.partial().extend({
  profileImage: z.string().url('올바른 이미지 URL이 아닙니다.').optional().nullable(),
  bodyConditionScore: z
    .number()
    .min(1, '체형 점수는 1~9 사이입니다.')
    .max(9, '체형 점수는 1~9 사이입니다.')
    .optional(),
})

// Health Condition Schema
export const healthConditionSchema = z.object({
  name: z.string({ required_error: '질환명을 입력해주세요.' }).min(1, '질환명을 입력해주세요.'),
  diagnosedDate: z.string().or(z.date()).transform((val) => new Date(val)),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE'], {
    errorMap: () => ({ message: '심각도를 선택해주세요.' }),
  }),
  status: z.enum(['ACTIVE', 'MANAGED', 'RESOLVED']).default('ACTIVE'),
  notes: z.string().max(500, '메모는 500자 이하로 입력해주세요.').optional().nullable(),
  vetVerified: z.boolean().default(false),
})

// Medication Schema
export const medicationSchema = z.object({
  name: z.string({ required_error: '약품명을 입력해주세요.' }).min(1, '약품명을 입력해주세요.'),
  dosage: z.string({ required_error: '용량을 입력해주세요.' }).min(1, '용량을 입력해주세요.'),
  frequency: z.string({ required_error: '복용 빈도를 입력해주세요.' }).min(1, '복용 빈도를 입력해주세요.'),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable(),
  reminders: z.boolean().default(true),
  reminderTimes: z.array(z.string()).default([]),
})

// Vaccination Schema
export const vaccinationSchema = z.object({
  name: z.string({ required_error: '백신명을 입력해주세요.' }).min(1, '백신명을 입력해주세요.'),
  dateAdministered: z.string().or(z.date()).transform((val) => new Date(val)),
  nextDueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  vetClinic: z.string().max(100).optional().nullable(),
  certificate: z.string().url('올바른 URL이 아닙니다.').optional().nullable(),
})

// ============================================================================
// Types
// ============================================================================

export type SpeciesType = z.infer<typeof Species>
export type GenderType = z.infer<typeof Gender>
export type PetSizeType = z.infer<typeof PetSize>
export type ActivityLevelType = z.infer<typeof ActivityLevel>
export type DietTypeType = z.infer<typeof DietType>

export type CreatePetInput = z.infer<typeof createPetSchema>
export type UpdatePetInput = z.infer<typeof updatePetSchema>
export type HealthConditionInput = z.infer<typeof healthConditionSchema>
export type MedicationInput = z.infer<typeof medicationSchema>
export type VaccinationInput = z.infer<typeof vaccinationSchema>
