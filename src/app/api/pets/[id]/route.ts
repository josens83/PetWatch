import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      include: {
        healthConditions: true,
        medications: {
          orderBy: { startDate: "desc" },
        },
        vaccinations: {
          orderBy: { nextDueDate: "asc" },
        },
        healthLogs: {
          orderBy: { date: "desc" },
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
          orderBy: { date: "desc" },
          take: 7,
          include: {
            anomalies: true,
            trends: true,
          },
        },
        healthAlerts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    return NextResponse.json(pet)
  } catch (error) {
    console.error("Error fetching pet:", error)
    return NextResponse.json(
      { error: "Failed to fetch pet" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Verify ownership
    const existingPet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    })

    if (!existingPet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    const updatedPet = await prisma.pet.update({
      where: { id },
      data: {
        name: body.name,
        breed: body.breed,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        gender: body.gender,
        neutered: body.neutered,
        weight: body.weight ? parseFloat(body.weight) : undefined,
        size: body.size,
        profileImage: body.profileImage,
        furColor: body.furColor,
        distinctiveFeatures: body.distinctiveFeatures,
        activityLevel: body.activityLevel,
        dietType: body.dietType,
        allergies: body.allergies,
      },
    })

    return NextResponse.json(updatedPet)
  } catch (error) {
    console.error("Error updating pet:", error)
    return NextResponse.json(
      { error: "Failed to update pet" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const existingPet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    })

    if (!existingPet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    await prisma.pet.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Pet deleted successfully" })
  } catch (error) {
    console.error("Error deleting pet:", error)
    return NextResponse.json(
      { error: "Failed to delete pet" },
      { status: 500 }
    )
  }
}
