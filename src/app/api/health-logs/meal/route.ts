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
      amount,
      consumedPercent,
      enthusiasm,
      foodBrand,
      foodProduct,
      foodType,
      isNewFood,
      vomitedAfter,
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

    // Create meal log
    const mealLog = await prisma.mealLog.create({
      data: {
        healthLogId: dailyLog.id,
        time: new Date(),
        type: type || "BREAKFAST",
        amount: amount || 0,
        consumedPercent: consumedPercent || 100,
        enthusiasm: enthusiasm || 3,
        foodBrand: foodBrand || null,
        foodProduct: foodProduct || null,
        foodType: foodType || pet.dietType,
        isNewFood: isNewFood || false,
        vomitedAfter: vomitedAfter || false,
        notes: notes || null,
      },
    })

    return NextResponse.json(mealLog, { status: 201 })
  } catch (error) {
    console.error("Error creating meal log:", error)
    return NextResponse.json(
      { error: "Failed to create meal log" },
      { status: 500 }
    )
  }
}
