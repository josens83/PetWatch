import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const petId = searchParams.get("petId")
    const days = parseInt(searchParams.get("days") || "7")

    if (!petId) {
      return NextResponse.json({ error: "petId is required" }, { status: 400 })
    }

    // Verify ownership
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        ownerId: session.user.id,
      },
    })

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.dailyHealthLog.findMany({
      where: {
        petId,
        date: { gte: startDate },
      },
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
      orderBy: { date: "desc" },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching health logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch health logs" },
      { status: 500 }
    )
  }
}

// Helper to get or create daily log
export async function getOrCreateDailyLog(petId: string, date: Date) {
  const dateOnly = new Date(date.toISOString().split("T")[0])

  let log = await prisma.dailyHealthLog.findUnique({
    where: {
      petId_date: {
        petId,
        date: dateOnly,
      },
    },
  })

  if (!log) {
    log = await prisma.dailyHealthLog.create({
      data: {
        petId,
        date: dateOnly,
        photos: [],
      },
    })
  }

  return log
}
