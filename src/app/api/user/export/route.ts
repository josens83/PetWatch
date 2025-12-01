/**
 * User Data Export API (GDPR Compliance)
 * Allows users to export all their personal data
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { handleApiError, successResponse } from '@/lib/api-utils'
import { AuthenticationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const userId = session.user.id

    // Fetch all user data
    const [user, pets, subscription] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.pet.findMany({
        where: { ownerId: userId },
        include: {
          healthConditions: true,
          medications: true,
          vaccinations: true,
          healthLogs: {
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
            include: {
              anomalies: true,
              trends: true,
            },
          },
          healthAlerts: true,
        },
      }),
      prisma.subscription.findUnique({
        where: { userId },
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        ...user,
        // Remove sensitive fields
        accounts: undefined,
        sessions: undefined,
      },
      pets: pets.map((pet) => ({
        ...pet,
        ownerId: undefined, // Remove reference ID
      })),
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            createdAt: subscription.createdAt,
          }
        : null,
    }

    logger.info('User data exported', { userId })

    // Return as downloadable JSON
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="petwatch-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
