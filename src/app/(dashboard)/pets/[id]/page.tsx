import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Dog,
  Cat,
  Heart,
  Activity,
  Utensils,
  Syringe,
  Pill,
  AlertCircle,
  Calendar,
  Weight,
  Edit,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { calculateAge, formatDate, getHealthScoreBgColor, getHealthScoreColor } from "@/lib/utils"
import { getBreedInfo } from "@/lib/breed-data"

async function getPet(petId: string, userId: string) {
  return prisma.pet.findFirst({
    where: {
      id: petId,
      ownerId: userId,
    },
    include: {
      healthConditions: true,
      medications: {
        where: {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        orderBy: { startDate: "desc" },
      },
      vaccinations: {
        orderBy: { nextDueDate: "asc" },
      },
      healthLogs: {
        orderBy: { date: "desc" },
        take: 7,
        include: {
          meals: true,
          eliminations: true,
          activity: true,
        },
      },
      healthAnalyses: {
        orderBy: { date: "desc" },
        take: 1,
        include: {
          anomalies: true,
          trends: true,
        },
      },
      healthAlerts: {
        where: { readAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })
}

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    notFound()
  }

  const pet = await getPet(id, session.user.id)

  if (!pet) {
    notFound()
  }

  const analysis = pet.healthAnalyses[0]
  const healthScore = analysis?.overallHealthScore || 75
  const breedInfo = getBreedInfo(pet.breed, pet.species === "DOG" ? "dog" : "cat")

  const upcomingVaccinations = pet.vaccinations.filter(
    (v) => new Date(v.nextDueDate) > new Date()
  )

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/pets/${pet.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Link>
        </Button>
      </div>

      {/* Pet Profile */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={pet.profileImage || ""} />
                <AvatarFallback
                  className={
                    pet.species === "DOG"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-purple-100 text-purple-600"
                  }
                >
                  {pet.species === "DOG" ? (
                    <Dog className="h-12 w-12 md:h-16 md:w-16" />
                  ) : (
                    <Cat className="h-12 w-12 md:h-16 md:w-16" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold">{pet.name}</h1>
                  {pet.gender === "MALE" ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      남아
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200">
                      여아
                    </Badge>
                  )}
                  {pet.neutered && (
                    <Badge variant="secondary">중성화</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{pet.breed}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {calculateAge(pet.birthDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    {pet.weight}kg
                  </span>
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="flex-1 md:max-w-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-red-500" />
                    건강 점수
                  </span>
                  <span className={`text-3xl font-bold ${getHealthScoreColor(healthScore)}`}>
                    {healthScore}
                  </span>
                </div>
                <Progress
                  value={healthScore}
                  className="h-3"
                  indicatorClassName={getHealthScoreBgColor(healthScore)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {healthScore >= 80
                    ? "건강한 상태입니다!"
                    : healthScore >= 60
                    ? "양호한 상태입니다."
                    : healthScore >= 40
                    ? "주의가 필요합니다."
                    : "관리가 필요합니다."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href={`/health/quick?pet=${pet.id}&type=meal`}>
            <Utensils className="h-6 w-6 text-orange-500" />
            <span className="text-sm">식사 기록</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href={`/health/quick?pet=${pet.id}&type=elimination`}>
            <Activity className="h-6 w-6 text-green-500" />
            <span className="text-sm">배변 기록</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href={`/health/quick?pet=${pet.id}&type=walk`}>
            <TrendingUp className="h-6 w-6 text-purple-500" />
            <span className="text-sm">산책 기록</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link href={`/chat?pet=${pet.id}`}>
            <Heart className="h-6 w-6 text-red-500" />
            <span className="text-sm">AI 상담</span>
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="health">건강 상태</TabsTrigger>
          <TabsTrigger value="records">기록</TabsTrigger>
          <TabsTrigger value="breed">품종 정보</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Alerts */}
          {pet.healthAlerts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5" />
                  건강 알림
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pet.healthAlerts.map((alert) => (
                    <li key={alert.id} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-muted-foreground">{alert.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Analysis Trends */}
          {analysis && analysis.trends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">최근 트렌드</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {analysis.trends.map((trend) => (
                    <div key={trend.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      {trend.direction === "up" ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : trend.direction === "down" ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{trend.metric}</p>
                        <p className="text-xs text-muted-foreground">
                          {trend.direction === "up" ? "+" : trend.direction === "down" ? "" : ""}
                          {trend.percentChange.toFixed(1)}% ({trend.period})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Vaccinations */}
          {upcomingVaccinations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-blue-500" />
                  예정된 백신
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {upcomingVaccinations.slice(0, 3).map((vac) => (
                    <li key={vac.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{vac.name}</p>
                        <p className="text-sm text-muted-foreground">
                          예정일: {formatDate(vac.nextDueDate)}
                        </p>
                      </div>
                      <Badge variant={
                        new Date(vac.nextDueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          ? "destructive"
                          : "outline"
                      }>
                        {Math.ceil((new Date(vac.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}일 후
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          {/* Health Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">건강 상태</CardTitle>
              <CardDescription>현재 관리 중인 건강 상태</CardDescription>
            </CardHeader>
            <CardContent>
              {pet.healthConditions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  등록된 건강 상태가 없습니다
                </p>
              ) : (
                <ul className="space-y-3">
                  {pet.healthConditions.map((condition) => (
                    <li key={condition.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{condition.name}</p>
                        <p className="text-sm text-muted-foreground">
                          진단일: {formatDate(condition.diagnosedDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          condition.status === "RESOLVED"
                            ? "success"
                            : condition.status === "MANAGED"
                            ? "secondary"
                            : "warning"
                        }>
                          {condition.status === "ACTIVE" ? "활성" : condition.status === "MANAGED" ? "관리중" : "완치"}
                        </Badge>
                        <Badge variant={
                          condition.severity === "SEVERE"
                            ? "destructive"
                            : condition.severity === "MODERATE"
                            ? "warning"
                            : "outline"
                        }>
                          {condition.severity === "MILD" ? "경미" : condition.severity === "MODERATE" ? "중등도" : "심각"}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-500" />
                복용 중인 약
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pet.medications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  복용 중인 약이 없습니다
                </p>
              ) : (
                <ul className="space-y-3">
                  {pet.medications.map((med) => (
                    <li key={med.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{med.name}</p>
                        <Badge variant="outline">{med.frequency}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        용량: {med.dosage}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">최근 기록</CardTitle>
              <CardDescription>최근 7일간의 건강 기록</CardDescription>
            </CardHeader>
            <CardContent>
              {pet.healthLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">아직 기록이 없습니다</p>
                  <Button asChild>
                    <Link href={`/health/quick?pet=${pet.id}`}>첫 기록 남기기</Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {pet.healthLogs.map((log) => (
                    <li key={log.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">{formatDate(log.date)}</p>
                        <div className="flex gap-2">
                          <Badge variant={
                            log.overallCondition >= 4 ? "success" :
                            log.overallCondition >= 3 ? "secondary" : "warning"
                          }>
                            컨디션 {log.overallCondition}/5
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">식사</p>
                          <p className="font-medium">{log.meals.length}회</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">배변</p>
                          <p className="font-medium">{log.eliminations.length}회</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">활동</p>
                          <p className="font-medium">{log.activity?.playTime || 0}분</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breed Info Tab */}
        <TabsContent value="breed" className="space-y-4">
          {breedInfo ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{pet.breed} 품종 정보</CardTitle>
                <CardDescription>품종별 건강 관리 가이드</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">기본 정보</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">적정 체중</span>
                        <span>{breedInfo.avgWeight.min}-{breedInfo.avgWeight.max}kg</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">평균 수명</span>
                        <span>{breedInfo.avgLifespan.min}-{breedInfo.avgLifespan.max}년</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">활동량</span>
                        <span>{breedInfo.exerciseNeeds === "low" ? "낮음" : breedInfo.exerciseNeeds === "moderate" ? "보통" : "높음"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">그루밍 필요도</span>
                        <span>{breedInfo.groomingNeeds === "low" ? "낮음" : breedInfo.groomingNeeds === "moderate" ? "보통" : "높음"}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">주의해야 할 질환</h4>
                    <div className="flex flex-wrap gap-2">
                      {breedInfo.commonHealthIssues.map((issue, i) => (
                        <Badge key={i} variant="outline">{issue}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {breedInfo.dietaryConsiderations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">식이 고려사항</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {breedInfo.dietaryConsiderations.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">품종 정보를 찾을 수 없습니다</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
