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
    const { petId, amount, notes } = body

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

    // Update water intake
    const updatedLog = await prisma.dailyHealthLog.update({
      where: { id: dailyLog.id },
      data: {
        waterIntake: (dailyLog.waterIntake || 0) + (amount || 0),
        observations: notes
          ? dailyLog.observations
            ? `${dailyLog.observations}\n${notes}`
            : notes
          : dailyLog.observations,
      },
    })

    return NextResponse.json(updatedLog, { status: 201 })
  } catch (error) {
    console.error("Error updating water intake:", error)
    return NextResponse.json(
      { error: "Failed to update water intake" },
      { status: 500 }
    )
  }
}
