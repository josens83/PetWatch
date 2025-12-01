/**
 * Validation Schemas Tests
 */

import {
  loginSchema,
  registerSchema,
  emailSchema,
  passwordSchema,
} from '@/lib/validations/user'

import {
  createPetSchema,
  Species,
  Gender,
  PetSize,
} from '@/lib/validations/pet'

import {
  mealLogSchema,
  walkLogSchema,
  MealType,
} from '@/lib/validations/health-log'

describe('User Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow()
    })

    it('should reject invalid email', () => {
      expect(() => emailSchema.parse('invalid')).toThrow()
      expect(() => emailSchema.parse('')).toThrow()
    })
  })

  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      expect(() => passwordSchema.parse('Password123')).not.toThrow()
    })

    it('should reject short password', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow()
    })

    it('should reject password without letters', () => {
      expect(() => passwordSchema.parse('12345678')).toThrow()
    })

    it('should reject password without numbers', () => {
      expect(() => passwordSchema.parse('Password')).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
    })

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        name: '홍길동',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        agreeToTerms: true,
        agreeToPrivacy: true,
      })

      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        name: '홍길동',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Different123',
        agreeToTerms: true,
        agreeToPrivacy: true,
      })

      expect(result.success).toBe(false)
    })

    it('should reject without terms agreement', () => {
      const result = registerSchema.safeParse({
        name: '홍길동',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        agreeToTerms: false,
        agreeToPrivacy: true,
      })

      expect(result.success).toBe(false)
    })
  })
})

describe('Pet Validation Schemas', () => {
  describe('Species', () => {
    it('should accept valid species', () => {
      expect(Species.parse('DOG')).toBe('DOG')
      expect(Species.parse('CAT')).toBe('CAT')
    })

    it('should reject invalid species', () => {
      expect(() => Species.parse('BIRD')).toThrow()
    })
  })

  describe('createPetSchema', () => {
    const validPet = {
      species: 'DOG',
      name: '바둑이',
      breed: '골든리트리버',
      birthDate: '2020-01-01',
      gender: 'MALE',
      weight: 25,
      size: 'LARGE',
    }

    it('should accept valid pet data', () => {
      const result = createPetSchema.safeParse(validPet)
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const result = createPetSchema.safeParse({
        species: 'DOG',
        name: '바둑이',
      })
      expect(result.success).toBe(false)
    })

    it('should reject future birth date', () => {
      const result = createPetSchema.safeParse({
        ...validPet,
        birthDate: '2030-01-01',
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative weight', () => {
      const result = createPetSchema.safeParse({
        ...validPet,
        weight: -5,
      })
      expect(result.success).toBe(false)
    })

    it('should set default values', () => {
      const result = createPetSchema.parse(validPet)

      expect(result.neutered).toBe(false)
      expect(result.activityLevel).toBe('MODERATE')
      expect(result.dietType).toBe('DRY_FOOD')
      expect(result.allergies).toEqual([])
    })
  })
})

describe('Health Log Validation Schemas', () => {
  describe('mealLogSchema', () => {
    const validMeal = {
      petId: 'clxxxxxxxxxxxxxxxxxx',
      time: new Date().toISOString(),
      type: 'BREAKFAST',
      amount: 200,
    }

    it('should accept valid meal data', () => {
      const result = mealLogSchema.safeParse(validMeal)
      expect(result.success).toBe(true)
    })

    it('should reject invalid meal type', () => {
      const result = mealLogSchema.safeParse({
        ...validMeal,
        type: 'BRUNCH',
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero amount', () => {
      const result = mealLogSchema.safeParse({
        ...validMeal,
        amount: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should set default values', () => {
      const result = mealLogSchema.parse(validMeal)

      expect(result.isNewFood).toBe(false)
      expect(result.consumedPercent).toBe(100)
      expect(result.enthusiasm).toBe(3)
      expect(result.vomitedAfter).toBe(false)
    })
  })

  describe('walkLogSchema', () => {
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

    const validWalk = {
      petId: 'clxxxxxxxxxxxxxxxxxx',
      startTime: now.toISOString(),
      endTime: oneHourLater.toISOString(),
      duration: 60,
    }

    it('should accept valid walk data', () => {
      const result = walkLogSchema.safeParse(validWalk)
      expect(result.success).toBe(true)
    })

    it('should reject end time before start time', () => {
      const result = walkLogSchema.safeParse({
        ...validWalk,
        startTime: oneHourLater.toISOString(),
        endTime: now.toISOString(),
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero duration', () => {
      const result = walkLogSchema.safeParse({
        ...validWalk,
        duration: 0,
      })
      expect(result.success).toBe(false)
    })
  })
})
