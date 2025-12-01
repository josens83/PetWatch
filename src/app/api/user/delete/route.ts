/**
 * User Account Deletion API (GDPR Compliance - Right to be Forgotten)
 * Permanently deletes all user data
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { handleApiError, noContentResponse, parseBody } from '@/lib/api-utils'
import { AuthenticationError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { compare } from 'bcryptjs'

const deleteAccountSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: '"DELETE"를 입력해주세요.' }),
  }),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const userId = session.user.id
    const body = await parseBody(request, deleteAccountSchema)

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          where: { provider: 'credentials' },
        },
      },
    })

    if (!user) {
      throw new AuthenticationError()
    }

    const passwordAccount = user.accounts.find((a) => a.provider === 'credentials')

    if (passwordAccount?.access_token) {
      const isValid = await compare(body.password, passwordAccount.access_token)
      if (!isValid) {
        throw new ValidationError('비밀번호가 일치하지 않습니다.', {
          password: ['비밀번호가 일치하지 않습니다.'],
        })
      }
    }

    // Cancel any active subscriptions (in a real app, would call payment provider)
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (subscription?.status === 'ACTIVE' && subscription.stripeSubscriptionId) {
      // TODO: Cancel Stripe subscription
      // await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
    }

    // Delete all user data (cascade handles related records)
    await prisma.user.delete({
      where: { id: userId },
    })

    logger.info('User account deleted', { userId, email: user.email })

    // In a production environment, you might want to:
    // 1. Send a confirmation email
    // 2. Keep an anonymized audit log
    // 3. Schedule actual deletion after a grace period

    return noContentResponse()
  } catch (error) {
    return handleApiError(error)
  }
}
