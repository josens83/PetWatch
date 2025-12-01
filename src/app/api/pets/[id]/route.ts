/**
 * Pet Detail API Routes
 * CRUD operations for individual pets
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { handleApiError, parseBody, successResponse, noContentResponse } from '@/lib/api-utils'
import { updatePetSchema } from '@/lib/validations/pet'
import { AuthenticationError, NotFoundError, AuthorizationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

// ============================================================================
// Helper: Verify ownership
// ============================================================================

async function verifyPetOwnership(petId: string, userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { ownerId: true },
  })

  if (!pet) {
    throw new NotFoundError('반려동물')
  }

  if (pet.ownerId !== userId) {
    throw new AuthorizationError('이 반려동물에 대한 접근 권한이 없습니다.')
  }

  return pet
}

// ============================================================================
// GET /api/pets/[id] - Get a single pet
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    await verifyPetOwnership(id, session.user.id)

    const pet = await prisma.pet.findUnique({
      where: { id },
      include: {
        healthConditions: {
          orderBy: { diagnosedDate: 'desc' },
        },
        medications: {
          orderBy: { startDate: 'desc' },
        },
        vaccinations: {
          orderBy: { nextDueDate: 'asc' },
        },
        healthLogs: {
          orderBy: { date: 'desc' },
          take: 30,
          include: {
            meals: true,
            eliminations: true,
            activity: {
              include: {
                walks: true,
                behaviors: true,
              },
            },
          },
        },
        healthAnalyses: {
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            anomalies: true,
            trends: true,
          },
        },
        healthAlerts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    logger.info('Pet fetched', { userId: session.user.id, petId: id })

    return successResponse(pet)
  } catch (error) {
    return handleApiError(error)
  }
}

// ============================================================================
// PUT/PATCH /api/pets/[id] - Update a pet
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    await verifyPetOwnership(id, session.user.id)

    // Parse and validate body
    const body = await parseBody(request, updatePetSchema)

    // Update pet
    const pet = await prisma.pet.update({
      where: { id },
      data: {
        ...(body.species && { species: body.species }),
        ...(body.name && { name: body.name }),
        ...(body.breed && { breed: body.breed }),
        ...(body.birthDate && { birthDate: body.birthDate }),
        ...(body.gender && { gender: body.gender }),
        ...(body.neutered !== undefined && { neutered: body.neutered }),
        ...(body.weight && { weight: body.weight }),
        ...(body.size && { size: body.size }),
        ...(body.furColor !== undefined && { furColor: body.furColor }),
        ...(body.distinctiveFeatures !== undefined && { distinctiveFeatures: body.distinctiveFeatures }),
        ...(body.activityLevel && { activityLevel: body.activityLevel }),
        ...(body.dietType && { dietType: body.dietType }),
        ...(body.allergies && { allergies: body.allergies }),
        ...(body.profileImage !== undefined && { profileImage: body.profileImage }),
        ...(body.bodyConditionScore && { bodyConditionScore: body.bodyConditionScore }),
      },
    })

    logger.info('Pet updated', { userId: session.user.id, petId: id })

    return successResponse(pet)
  } catch (error) {
    return handleApiError(error)
  }
}

export const PUT = PATCH

// ============================================================================
// DELETE /api/pets/[id] - Delete a pet
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    await verifyPetOwnership(id, session.user.id)

    // Delete pet (cascade will handle related records)
    await prisma.pet.delete({
      where: { id },
    })

    logger.info('Pet deleted', { userId: session.user.id, petId: id })

    return noContentResponse()
  } catch (error) {
    return handleApiError(error)
  }
}
