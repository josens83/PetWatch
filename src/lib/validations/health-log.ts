/**
 * Health Log Validation Schemas
 */

import { z } from 'zod'

// ============================================================================
// Enums
// ============================================================================

export const MealType = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'TREAT'], {
  errorMap: () => ({ message: '식사 유형을 선택해주세요.' }),
})

export const EliminationType = z.enum(['URINE', 'FECES'], {
  errorMap: () => ({ message: '배변 유형을 선택해주세요.' }),
})

export const LogSource = z.enum(['MANUAL', 'IOT', 'MIXED']).default('MANUAL')

// ============================================================================
// Common Schemas
// ============================================================================

const timeSchema = z
  .string()
  .or(z.date())
  .transform((val) => new Date(val))

const dateSchema = z
  .string()
  .or(z.date())
  .transform((val) => {
    const date = new Date(val)
    // Set to start of day
    date.setHours(0, 0, 0, 0)
    return date
  })

const conditionScoreSchema = z
  .number()
  .min(1, '1~5 사이의 값을 선택해주세요.')
  .max(5, '1~5 사이의 값을 선택해주세요.')

const notesSchema = z.string().max(500, '메모는 500자 이하로 입력해주세요.').optional().nullable()

// ============================================================================
// Daily Health Log Schema
// ============================================================================

export const dailyHealthLogSchema = z.object({
  petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid('올바른 ID 형식이 아닙니다.'),
  date: dateSchema,
  waterIntake: z
    .number()
    .min(0, '음수량은 0 이상이어야 합니다.')
    .max(10000, '음수량이 너무 많습니다.')
    .optional()
    .nullable(),
  weight: z
    .number()
    .min(0.1, '체중은 0.1kg 이상이어야 합니다.')
    .max(200, '체중이 너무 큽니다.')
    .optional()
    .nullable(),
  overallCondition: conditionScoreSchema.default(3),
  energyLevel: conditionScoreSchema.default(3),
  appetiteLevel: conditionScoreSchema.default(3),
  observations: notesSchema,
  photos: z.array(z.string().url('올바른 이미지 URL이 아닙니다.')).default([]),
  source: LogSource,
})

// ============================================================================
// Meal Log Schema
// ============================================================================

export const mealLogSchema = z.object({
  petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid(),
  time: timeSchema,
  type: MealType,
  foodBrand: z.string().max(100).optional().nullable(),
  foodProduct: z.string().max(100).optional().nullable(),
  foodType: z.enum(['DRY_FOOD', 'WET_FOOD', 'RAW', 'HOMEMADE', 'PRESCRIPTION', 'MIXED']).default('DRY_FOOD'),
  isNewFood: z.boolean().default(false),
  amount: z
    .number({ required_error: '양을 입력해주세요.' })
    .min(1, '양은 1g 이상이어야 합니다.')
    .max(5000, '양이 너무 많습니다.'),
  consumedPercent: z
    .number()
    .min(0, '섭취율은 0~100% 사이입니다.')
    .max(100, '섭취율은 0~100% 사이입니다.')
    .default(100),
  enthusiasm: conditionScoreSchema.default(3),
  vomitedAfter: z.boolean().default(false),
  notes: notesSchema,
})

// ============================================================================
// Elimination Log Schema
// ============================================================================

export const eliminationLogSchema = z.object({
  petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid(),
  time: timeSchema,
  type: EliminationType,
  fecesConsistency: z
    .number()
    .min(1, '1~7 사이의 값을 선택해주세요.')
    .max(7, '1~7 사이의 값을 선택해주세요.')
    .optional()
    .nullable(),
  fecesColor: z.string().max(30).optional().nullable(),
  urineColor: z.string().max(30).optional().nullable(),
  urineAmount: z.enum(['SMALL', 'NORMAL', 'LARGE']).optional().nullable(),
  straining: z.boolean().default(false),
  frequency: z.enum(['LESS_THAN_NORMAL', 'NORMAL', 'MORE_THAN_NORMAL']).default('NORMAL'),
  usedLitterBox: z.boolean().optional().nullable(),
  hadAccident: z.boolean().default(false),
  notes: notesSchema,
  photo: z.string().url('올바른 이미지 URL이 아닙니다.').optional().nullable(),
})

// ============================================================================
// Walk Log Schema
// ============================================================================

export const walkLogSchema = z
  .object({
    petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid(),
    startTime: timeSchema,
    endTime: timeSchema,
    duration: z
      .number()
      .min(1, '산책 시간은 1분 이상이어야 합니다.')
      .max(480, '산책 시간이 너무 깁니다.'),
    distance: z
      .number()
      .min(0, '거리는 0 이상이어야 합니다.')
      .max(100, '거리가 너무 깁니다.')
      .optional()
      .nullable(),
    poopCount: z
      .number()
      .min(0)
      .max(20, '배변 횟수가 너무 많습니다.')
      .default(0),
    peeCount: z
      .number()
      .min(0)
      .max(30, '배뇨 횟수가 너무 많습니다.')
      .default(0),
    notes: notesSchema,
  })
  .refine((data) => data.endTime > data.startTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
    path: ['endTime'],
  })

// ============================================================================
// Water Intake Log Schema
// ============================================================================

export const waterIntakeLogSchema = z.object({
  petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid(),
  date: dateSchema,
  amount: z
    .number({ required_error: '음수량을 입력해주세요.' })
    .min(1, '음수량은 1ml 이상이어야 합니다.')
    .max(10000, '음수량이 너무 많습니다.'),
  notes: notesSchema,
})

// ============================================================================
// Activity Log Schema
// ============================================================================

export const activityLogSchema = z.object({
  petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid(),
  date: dateSchema,
  playTime: z.number().min(0).max(720).default(0),
  restTime: z.number().min(0).max(1440).default(0),
  steps: z.number().min(0).max(100000).optional().nullable(),
  activeMinutes: z.number().min(0).max(1440).optional().nullable(),
  sleepHours: z.number().min(0).max(24).optional().nullable(),
  sleepQuality: conditionScoreSchema.optional().nullable(),
})

// ============================================================================
// Behavior Observation Schema
// ============================================================================

export const behaviorObservationSchema = z.object({
  petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid(),
  behavior: z.string({ required_error: '행동을 입력해주세요.' }).min(1).max(100),
  frequency: z.enum(['ONCE', 'OCCASIONAL', 'FREQUENT', 'CONSTANT']).default('ONCE'),
  notes: notesSchema,
})

// ============================================================================
// Quick Log Schema (Combined)
// ============================================================================

export const quickLogSchema = z.object({
  petId: z.string({ required_error: '반려동물을 선택해주세요.' }).cuid(),
  date: dateSchema.default(() => new Date()),
  logType: z.enum(['MEAL', 'WATER', 'ELIMINATION', 'WALK']),

  // Meal specific
  mealType: MealType.optional(),
  mealAmount: z.number().min(1).max(5000).optional(),
  consumedPercent: z.number().min(0).max(100).optional(),

  // Water specific
  waterAmount: z.number().min(1).max(10000).optional(),

  // Elimination specific
  eliminationType: EliminationType.optional(),
  fecesConsistency: z.number().min(1).max(7).optional(),

  // Walk specific
  walkDuration: z.number().min(1).max(480).optional(),
  walkDistance: z.number().min(0).max(100).optional(),

  notes: notesSchema,
})

// ============================================================================
// Types
// ============================================================================

export type MealTypeType = z.infer<typeof MealType>
export type EliminationTypeType = z.infer<typeof EliminationType>
export type LogSourceType = z.infer<typeof LogSource>

export type DailyHealthLogInput = z.infer<typeof dailyHealthLogSchema>
export type MealLogInput = z.infer<typeof mealLogSchema>
export type EliminationLogInput = z.infer<typeof eliminationLogSchema>
export type WalkLogInput = z.infer<typeof walkLogSchema>
export type WaterIntakeLogInput = z.infer<typeof waterIntakeLogSchema>
export type ActivityLogInput = z.infer<typeof activityLogSchema>
export type BehaviorObservationInput = z.infer<typeof behaviorObservationSchema>
export type QuickLogInput = z.infer<typeof quickLogSchema>
