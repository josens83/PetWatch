import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Bell,
  Utensils,
  Droplets,
  Activity,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Dog,
  Cat,
} from "lucide-react"
import { formatDate, calculateAge, getHealthScoreBgColor } from "@/lib/utils"

async function getUserPets(userId: string) {
  const pets = await prisma.pet.findMany({
    where: { ownerId: userId },
    include: {
      healthLogs: {
        orderBy: { date: "desc" },
        take: 1,
      },
      healthAnalyses: {
        orderBy: { date: "desc" },
        take: 1,
      },
      healthAlerts: {
        where: { readAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })
  return pets
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const pets = session?.user?.id ? await getUserPets(session.user.id) : []

  const todaysTasks = [
    { id: 1, task: "아침 식사 기록", completed: false, pet: pets[0]?.name },
    { id: 2, task: "산책 기록", completed: false, pet: pets[0]?.name },
    { id: 3, task: "저녁 식사 기록", completed: false, pet: pets[0]?.name },
  ]

  const unreadAlerts = pets.flatMap((pet) =>
    pet.healthAlerts.map((alert) => ({ ...alert, petName: pet.name }))
  )

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            안녕하세요, {session?.user?.name}님!
          </h1>
          <p className="text-muted-foreground">
            {formatDate(new Date())} 오늘도 반려동물과 행복한 하루 보내세요
          </p>
        </div>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              {unreadAlerts.length}
            </span>
          )}
        </Button>
      </div>

      {/* Pets Overview */}
      {pets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex gap-2 mb-4">
              <Dog className="h-12 w-12 text-blue-500 opacity-50" />
              <Cat className="h-12 w-12 text-purple-500 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              아직 등록된 반려동물이 없어요
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              반려동물을 등록하고 건강 관리를 시작해보세요!
            </p>
            <Button asChild>
              <Link href="/pets/new">
                <Plus className="mr-2 h-4 w-4" />
                반려동물 등록하기
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => {
            const healthScore =
              pet.healthAnalyses[0]?.overallHealthScore || 75
            return (
              <Link key={pet.id} href={`/pets/${pet.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={pet.profileImage || ""} />
                        <AvatarFallback
                          className={
                            pet.species === "DOG"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-purple-100 text-purple-600"
                          }
                        >
                          {pet.species === "DOG" ? (
                            <Dog className="h-8 w-8" />
                          ) : (
                            <Cat className="h-8 w-8" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{pet.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {pet.breed}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(pet.birthDate)} · {pet.weight}kg
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>건강 점수</span>
                            <span className="font-medium">{healthScore}점</span>
                          </div>
                          <Progress
                            value={healthScore}
                            className="h-2"
                            indicatorClassName={getHealthScoreBgColor(
                              healthScore
                            )}
                          />
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          <Link href="/pets/new">
            <Card className="border-dashed hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer h-full">
              <CardContent className="flex items-center justify-center h-full min-h-[120px]">
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    반려동물 추가
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">빠른 기록</CardTitle>
          <CardDescription>오늘의 건강 상태를 기록해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/health/quick?type=meal">
                <Utensils className="h-6 w-6 text-orange-500" />
                <span className="text-sm">식사 기록</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/health/quick?type=water">
                <Droplets className="h-6 w-6 text-blue-500" />
                <span className="text-sm">음수량</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/health/quick?type=elimination">
                <Activity className="h-6 w-6 text-green-500" />
                <span className="text-sm">배변 기록</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/health/quick?type=walk">
                <TrendingUp className="h-6 w-6 text-purple-500" />
                <span className="text-sm">산책 기록</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Tasks & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">오늘의 할 일</CardTitle>
          </CardHeader>
          <CardContent>
            {pets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                반려동물을 등록하면 할 일이 표시됩니다
              </p>
            ) : (
              <ul className="space-y-3">
                {todaysTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      className="h-4 w-4 rounded border-gray-300"
                      readOnly
                    />
                    <span
                      className={
                        task.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {task.task}
                    </span>
                    {task.pet && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {task.pet}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Health Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              건강 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unreadAlerts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  새로운 알림이 없습니다
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {unreadAlerts.slice(0, 3).map((alert) => (
                  <li
                    key={alert.id}
                    className="p-3 rounded-lg bg-orange-50 border border-orange-200"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.petName} · {formatDate(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
