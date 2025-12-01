import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// This is a mock implementation
// In production, integrate with Stripe or other payment provider

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingPeriod } = body

    // Validate plan
    const validPlans = ["free", "premium", "premium_plus"]
    if (!validPlans.includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // For demo purposes, directly update subscription
    // In production, create Stripe checkout session
    const planMap: Record<string, "FREE" | "PREMIUM" | "PREMIUM_PLUS"> = {
      free: "FREE",
      premium: "PREMIUM",
      premium_plus: "PREMIUM_PLUS",
    }

    const periodEnd = new Date()
    if (billingPeriod === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: planMap[planId],
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
      create: {
        userId: session.user.id,
        plan: planMap[planId],
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
    })

    // In production, return Stripe checkout URL
    // return NextResponse.json({ url: stripeSession.url })

    // For demo, return success
    return NextResponse.json({
      success: true,
      message: "구독이 업데이트되었습니다.",
      redirectUrl: "/subscription?success=true",
    })
  } catch (error) {
    console.error("Error creating checkout:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
