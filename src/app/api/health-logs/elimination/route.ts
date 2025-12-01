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
    const {
      petId,
      type,
      fecesConsistency,
      fecesColor,
      urineColor,
      urineAmount,
      straining,
      frequency,
      usedLitterBox,
      hadAccident,
      notes,
    } = body

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

    // Create elimination log
    const eliminationLog = await prisma.eliminationLog.create({
      data: {
        healthLogId: dailyLog.id,
        time: new Date(),
        type: type || "FECES",
        fecesConsistency: fecesConsistency || null,
        fecesColor: fecesColor || null,
        urineColor: urineColor || null,
        urineAmount: urineAmount || null,
        straining: straining || false,
        frequency: frequency || "normal",
        usedLitterBox: usedLitterBox,
        hadAccident: hadAccident || false,
        notes: notes || null,
      },
    })

    return NextResponse.json(eliminationLog, { status: 201 })
  } catch (error) {
    console.error("Error creating elimination log:", error)
    return NextResponse.json(
      { error: "Failed to create elimination log" },
      { status: 500 }
    )
  }
}
