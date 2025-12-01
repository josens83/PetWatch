import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Plus, Dog, Cat, ChevronRight, Heart } from "lucide-react"
import { calculateAge, getHealthScoreBgColor } from "@/lib/utils"

async function getUserPets(userId: string) {
  return prisma.pet.findMany({
    where: { ownerId: userId },
    include: {
      healthAnalyses: {
        orderBy: { date: "desc" },
        take: 1,
      },
      _count: {
        select: {
          healthLogs: true,
          healthConditions: true,
          vaccinations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export default async function PetsPage() {
  const session = await getServerSession(authOptions)
  const pets = session?.user?.id ? await getUserPets(session.user.id) : []

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">반려동물</h1>
          <p className="text-muted-foreground">
            {pets.length}마리의 반려동물을 관리하고 있어요
          </p>
        </div>
        <Button asChild>
          <Link href="/pets/new">
            <Plus className="mr-2 h-4 w-4" />
            등록하기
          </Link>
        </Button>
      </div>

      {/* Pet List */}
      {pets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex gap-2 mb-4">
              <Dog className="h-16 w-16 text-blue-500 opacity-50" />
              <Cat className="h-16 w-16 text-purple-500 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              아직 등록된 반려동물이 없어요
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              반려동물을 등록하고 AI 기반 건강 관리를 시작해보세요.
              식사, 배변, 활동량을 기록하고 건강 상태를 분석받을 수 있어요.
            </p>
            <Button size="lg" asChild>
              <Link href="/pets/new">
                <Plus className="mr-2 h-5 w-5" />
                첫 번째 반려동물 등록하기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => {
            const healthScore = pet.healthAnalyses[0]?.overallHealthScore || 75

            return (
              <Link key={pet.id} href={`/pets/${pet.id}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
                  <div
                    className={`h-2 ${
                      pet.species === "DOG"
                        ? "bg-gradient-to-r from-blue-400 to-blue-600"
                        : "bg-gradient-to-r from-purple-400 to-purple-600"
                    }`}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-20 w-20 border-2 border-background shadow">
                        <AvatarImage src={pet.profileImage || ""} />
                        <AvatarFallback
                          className={
                            pet.species === "DOG"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-purple-100 text-purple-600"
                          }
                        >
                          {pet.species === "DOG" ? (
                            <Dog className="h-10 w-10" />
                          ) : (
                            <Cat className="h-10 w-10" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold truncate">
                            {pet.name}
                          </h3>
                          {pet.gender === "MALE" ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                              남아
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200">
                              여아
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {pet.breed}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            {calculateAge(pet.birthDate)}
                          </span>
                          <span className="mx-2 text-muted-foreground">·</span>
                          <span className="font-medium">{pet.weight}kg</span>
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    {/* Health Score */}
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center gap-1.5">
                          <Heart className="h-4 w-4 text-red-500" />
                          건강 점수
                        </span>
                        <span className="font-bold text-lg">{healthScore}</span>
                      </div>
                      <Progress
                        value={healthScore}
                        className="h-2"
                        indicatorClassName={getHealthScoreBgColor(healthScore)}
                      />
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>기록 {pet._count.healthLogs}회</span>
                      <span>·</span>
                      <span>건강상태 {pet._count.healthConditions}개</span>
                      <span>·</span>
                      <span>백신 {pet._count.vaccinations}개</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}

          {/* Add New Pet Card */}
          <Link href="/pets/new">
            <Card className="border-dashed hover:border-primary hover:bg-primary/5 transition-all cursor-pointer h-full min-h-[280px]">
              <CardContent className="flex flex-col items-center justify-center h-full">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium">새 반려동물 등록</p>
                <p className="text-sm text-muted-foreground mt-1">
                  클릭하여 추가하기
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  )
}
