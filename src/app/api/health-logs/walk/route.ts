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
    const { petId, duration, distance, poopCount, peeCount, notes } = body

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

    // Get or create daily log
    const today = new Date()
    const dateOnly = new Date(today.toISOString().split("T")[0])

    let dailyLog = await prisma.dailyHealthLog.findUnique({
      where: {
        petId_date: {
          petId,
          date: dateOnly,
        },
      },
    })

    if (!dailyLog) {
      dailyLog = await prisma.dailyHealthLog.create({
        data: {
          petId,
          date: dateOnly,
          photos: [],
        },
      })
    }

    // Get or create activity log
    let activityLog = await prisma.activityLog.findUnique({
      where: { healthLogId: dailyLog.id },
    })

    if (!activityLog) {
      activityLog = await prisma.activityLog.create({
        data: {
          healthLogId: dailyLog.id,
        },
      })
    }

    // Create walk log
    const now = new Date()
    const startTime = new Date(now.getTime() - duration * 60 * 1000)

    const walkLog = await prisma.walkLog.create({
      data: {
        activityLogId: activityLog.id,
        startTime,
        endTime: now,
        duration: duration || 0,
        distance: distance || null,
        poopCount: poopCount || 0,
        peeCount: peeCount || 0,
        notes: notes || null,
      },
    })

    return NextResponse.json(walkLog, { status: 201 })
  } catch (error) {
    console.error("Error creating walk log:", error)
    return NextResponse.json(
      { error: "Failed to create walk log" },
      { status: 500 }
    )
  }
}
