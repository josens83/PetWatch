import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { petId, days = 7 } = body

    // Verify ownership
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        ownerId: session.user.id,
      },
      include: {
        healthConditions: true,
        healthLogs: {
          where: {
            date: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            meals: true,
            eliminations: true,
            activity: {
              include: {
                walks: true,
              },
            },
          },
        },
      },
    })

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.plan === "FREE") {
      // Free users get limited analysis
      return NextResponse.json({
        analysis: {
          overallScore: 75,
          categories: {
            nutrition: { score: 72, status: "good", trend: "stable" },
            digestion: { score: 78, status: "good", trend: "stable" },
            activity: { score: 70, status: "fair", trend: "stable" },
            hydration: { score: 75, status: "good", trend: "stable" },
          },
          recommendations: [
            "프리미엄 구독으로 업그레이드하시면 더 상세한 AI 분석을 받으실 수 있습니다.",
            "정기적인 건강 기록을 남겨주세요.",
          ],
          vetVisitRecommended: false,
          limited: true,
        },
      })
    }

    // Generate comprehensive analysis
    const analysis = await generateHealthAnalysis(pet)

    // Save analysis to database
    const savedAnalysis = await prisma.healthAnalysis.upsert({
      where: {
        petId_date: {
          petId: pet.id,
          date: new Date(new Date().toISOString().split("T")[0]),
        },
      },
      update: {
        overallHealthScore: analysis.overallScore,
        nutritionScore: analysis.categories.nutrition.score,
        nutritionStatus: analysis.categories.nutrition.status,
        nutritionChange: analysis.categories.nutrition.trend,
        digestionScore: analysis.categories.digestion.score,
        digestionStatus: analysis.categories.digestion.status,
        digestionChange: analysis.categories.digestion.trend,
        activityScore: analysis.categories.activity.score,
        activityStatus: analysis.categories.activity.status,
        activityChange: analysis.categories.activity.trend,
        hydrationScore: analysis.categories.hydration.score,
        hydrationStatus: analysis.categories.hydration.status,
        hydrationChange: analysis.categories.hydration.trend,
        behaviorScore: 75,
        behaviorStatus: "good",
        behaviorChange: "stable",
        recommendations: analysis.recommendations,
        vetVisitRecommended: analysis.vetVisitRecommended,
        vetVisitReason: analysis.vetVisitReason,
      },
      create: {
        petId: pet.id,
        date: new Date(new Date().toISOString().split("T")[0]),
        overallHealthScore: analysis.overallScore,
        nutritionScore: analysis.categories.nutrition.score,
        nutritionStatus: analysis.categories.nutrition.status,
        nutritionChange: analysis.categories.nutrition.trend,
        digestionScore: analysis.categories.digestion.score,
        digestionStatus: analysis.categories.digestion.status,
        digestionChange: analysis.categories.digestion.trend,
        activityScore: analysis.categories.activity.score,
        activityStatus: analysis.categories.activity.status,
        activityChange: analysis.categories.activity.trend,
        hydrationScore: analysis.categories.hydration.score,
        hydrationStatus: analysis.categories.hydration.status,
        hydrationChange: analysis.categories.hydration.trend,
        behaviorScore: 75,
        behaviorStatus: "good",
        behaviorChange: "stable",
        recommendations: analysis.recommendations,
        vetVisitRecommended: analysis.vetVisitRecommended,
        vetVisitReason: analysis.vetVisitReason,
      },
    })

    return NextResponse.json({ analysis, savedId: savedAnalysis.id })
  } catch (error) {
    console.error("Error in AI analysis:", error)
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    )
  }
}

interface PetWithLogs {
  id: string
  name: string
  species: "DOG" | "CAT"
  breed: string
  weight: number
  activityLevel: string
  healthConditions: { name: string }[]
  healthLogs: {
    meals: { amount: number; consumedPercent: number; enthusiasm: number }[]
    eliminations: { type: string; fecesConsistency: number | null }[]
    activity: { walks: { duration: number }[] } | null
    waterIntake: number | null
    overallCondition: number
  }[]
}

async function generateHealthAnalysis(pet: PetWithLogs) {
  const logs = pet.healthLogs
  const logCount = logs.length

  // Calculate averages
  const avgCondition =
    logCount > 0
      ? logs.reduce((sum, l) => sum + l.overallCondition, 0) / logCount
      : 3

  const totalMeals = logs.reduce((sum, l) => sum + l.meals.length, 0)
  const avgMealsPerDay = logCount > 0 ? totalMeals / logCount : 0

  const avgEnthusiasm =
    totalMeals > 0
      ? logs.reduce(
          (sum, l) =>
            sum + l.meals.reduce((s, m) => s + m.enthusiasm, 0),
          0
        ) / totalMeals
      : 3

  const totalEliminations = logs.reduce((sum, l) => sum + l.eliminations.length, 0)
  const avgEliminationsPerDay = logCount > 0 ? totalEliminations / logCount : 0

  const fecesLogs = logs.flatMap((l) =>
    l.eliminations.filter((e) => e.type === "FECES" && e.fecesConsistency)
  )
  const avgFecesConsistency =
    fecesLogs.length > 0
      ? fecesLogs.reduce((sum, e) => sum + (e.fecesConsistency || 4), 0) /
        fecesLogs.length
      : 4

  const totalWalkMinutes = logs.reduce(
    (sum, l) =>
      sum + (l.activity?.walks.reduce((s, w) => s + w.duration, 0) || 0),
    0
  )
  const avgWalkMinutesPerDay = logCount > 0 ? totalWalkMinutes / logCount : 0

  const totalWater = logs.reduce((sum, l) => sum + (l.waterIntake || 0), 0)
  const avgWaterPerDay = logCount > 0 ? totalWater / logCount : 0

  // Calculate scores based on data
  const nutritionScore = Math.min(
    100,
    Math.round(
      60 +
        avgMealsPerDay * 10 +
        avgEnthusiasm * 5
    )
  )

  const digestionScore = Math.min(
    100,
    Math.round(
      70 +
        (Math.abs(avgFecesConsistency - 4) < 1 ? 20 : 0) +
        (avgEliminationsPerDay >= 1 ? 10 : 0)
    )
  )

  const expectedWalkTime = pet.activityLevel === "HIGH" ? 60 : pet.activityLevel === "LOW" ? 20 : 40
  const activityScore = Math.min(
    100,
    Math.round(50 + (avgWalkMinutesPerDay / expectedWalkTime) * 50)
  )

  const expectedWater = pet.weight * 50 // 50ml per kg
  const hydrationScore = Math.min(
    100,
    Math.round(50 + (avgWaterPerDay / expectedWater) * 50)
  )

  const overallScore = Math.round(
    nutritionScore * 0.3 +
      digestionScore * 0.25 +
      activityScore * 0.25 +
      hydrationScore * 0.2
  )

  const getStatus = (score: number) => {
    if (score >= 85) return "excellent"
    if (score >= 70) return "good"
    if (score >= 50) return "fair"
    return "concerning"
  }

  // Generate recommendations
  const recommendations: string[] = []

  if (avgMealsPerDay < 2) {
    recommendations.push("식사 횟수가 적습니다. 하루 2-3회 규칙적인 식사를 권장합니다.")
  }
  if (avgEnthusiasm < 3) {
    recommendations.push("식욕이 떨어진 것 같습니다. 사료 변경이나 건강 체크를 고려해보세요.")
  }
  if (avgWalkMinutesPerDay < expectedWalkTime * 0.7) {
    recommendations.push(`산책 시간을 늘려보세요. 하루 ${expectedWalkTime}분 이상을 권장합니다.`)
  }
  if (avgWaterPerDay < expectedWater * 0.7) {
    recommendations.push(`음수량이 부족합니다. 하루 ${Math.round(expectedWater)}ml 이상 섭취를 권장합니다.`)
  }
  if (avgFecesConsistency < 3 || avgFecesConsistency > 5) {
    recommendations.push("배변 상태가 정상 범위를 벗어났습니다. 식이 조절이나 건강 체크를 권장합니다.")
  }

  if (recommendations.length === 0) {
    recommendations.push("전반적으로 건강 상태가 양호합니다! 현재 케어 패턴을 유지해주세요.")
  }

  const vetVisitRecommended =
    overallScore < 60 ||
    avgEnthusiasm < 2 ||
    avgFecesConsistency < 2 ||
    avgFecesConsistency > 6

  return {
    overallScore,
    categories: {
      nutrition: {
        score: nutritionScore,
        status: getStatus(nutritionScore),
        trend: avgEnthusiasm >= 3 ? "stable" : "declining",
      },
      digestion: {
        score: digestionScore,
        status: getStatus(digestionScore),
        trend: "stable",
      },
      activity: {
        score: activityScore,
        status: getStatus(activityScore),
        trend: avgWalkMinutesPerDay >= expectedWalkTime * 0.8 ? "improving" : "stable",
      },
      hydration: {
        score: hydrationScore,
        status: getStatus(hydrationScore),
        trend: "stable",
      },
    },
    recommendations,
    vetVisitRecommended,
    vetVisitReason: vetVisitRecommended
      ? "건강 지표에 이상이 감지되었습니다. 수의사 상담을 권장합니다."
      : undefined,
  }
}
