/**
 * Pet API Routes
 * CRUD operations for pet management
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  createApiHandler,
  successResponse,
  createdResponse,
  parseBody,
  parsePagination,
  paginatedResponse,
  checkPetLimit,
} from '@/lib/api-utils'
import { createPetSchema } from '@/lib/validations/pet'
import { logger } from '@/lib/logger'

// ============================================================================
// GET /api/pets - List all pets for current user
// ============================================================================

export const GET = createApiHandler(async (request, { userId }) => {
  const pagination = parsePagination(request.url)

  const [pets, total] = await Promise.all([
    prisma.pet.findMany({
      where: { ownerId: userId },
      include: {
        healthConditions: {
          where: { status: 'ACTIVE' },
          take: 3,
        },
        medications: {
          where: {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
          take: 3,
        },
        vaccinations: {
          where: {
            nextDueDate: { gte: new Date() },
          },
          orderBy: { nextDueDate: 'asc' },
          take: 3,
        },
        healthLogs: {
          orderBy: { date: 'desc' },
          take: 7,
        },
        healthAnalyses: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        healthAlerts: {
          where: { readAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.pet.count({ where: { ownerId: userId } }),
  ])

  logger.info('Pets fetched', { userId, count: pets.length })

  return paginatedResponse(pets, total, pagination)
})

// ============================================================================
// POST /api/pets - Create a new pet
// ============================================================================

export const POST = createApiHandler(async (request, { userId }) => {
  // Check pet limit before creating
  await checkPetLimit(userId)

  // Parse and validate body
  const body = await parseBody(request, createPetSchema)

  // Create pet
  const pet = await prisma.pet.create({
    data: {
      ownerId: userId,
      species: body.species,
      name: body.name,
      breed: body.breed,
      birthDate: body.birthDate,
      gender: body.gender,
      neutered: body.neutered,
      weight: body.weight,
      size: body.size,
      furColor: body.furColor,
      distinctiveFeatures: body.distinctiveFeatures,
      activityLevel: body.activityLevel,
      dietType: body.dietType,
      allergies: body.allergies,
    },
  })

  logger.info('Pet created', {
    userId,
    petId: pet.id,
    species: pet.species,
  })

  return createdResponse(pet)
})
