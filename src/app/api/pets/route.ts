import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pets = await prisma.pet.findMany({
      where: { ownerId: session.user.id },
      include: {
        healthConditions: true,
        medications: true,
        vaccinations: true,
        healthLogs: {
          orderBy: { date: "desc" },
          take: 7,
        },
        healthAnalyses: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(pets)
  } catch (error) {
    console.error("Error fetching pets:", error)
    return NextResponse.json(
      { error: "Failed to fetch pets" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const {
      species,
      name,
      breed,
      birthDate,
      gender,
      neutered,
      weight,
      size,
      furColor,
      distinctiveFeatures,
      activityLevel,
      dietType,
      allergies,
    } = body

    // Validation
    if (!species || !name || !breed || !birthDate || !gender || !weight || !size) {
      return NextResponse.json(
        { error: "필수 정보를 모두 입력해주세요." },
        { status: 400 }
      )
    }

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    const existingPetsCount = await prisma.pet.count({
      where: { ownerId: session.user.id },
    })

    if (subscription?.plan === "FREE" && existingPetsCount >= 1) {
      return NextResponse.json(
        { error: "무료 플랜에서는 1마리만 등록할 수 있습니다. 프리미엄으로 업그레이드해주세요." },
        { status: 403 }
      )
    }

    const pet = await prisma.pet.create({
      data: {
        ownerId: session.user.id,
        species,
        name,
        breed,
        birthDate: new Date(birthDate),
        gender,
        neutered: neutered || false,
        weight: parseFloat(weight),
        size,
        furColor: furColor || null,
        distinctiveFeatures: distinctiveFeatures || null,
        activityLevel: activityLevel || "MODERATE",
        dietType: dietType || "DRY_FOOD",
        allergies: allergies || [],
      },
    })

    return NextResponse.json(pet, { status: 201 })
  } catch (error) {
    console.error("Error creating pet:", error)
    return NextResponse.json(
      { error: "반려동물 등록에 실패했습니다." },
      { status: 500 }
    )
  }
}
