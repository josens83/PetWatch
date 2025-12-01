"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Dog,
  Cat,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Utensils,
  Droplets,
  Activity,
  Brain,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getHealthScoreColor, getHealthScoreBgColor } from "@/lib/utils"

interface Pet {
  id: string
  name: string
  species: "DOG" | "CAT"
  breed: string
  weight: number
}

interface HealthData {
  date: string
  meals: number
  waterIntake: number
  eliminations: number
  walkMinutes: number
  overallCondition: number
}

export default function ReportsPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<string>("")
  const [period, setPeriod] = useState("7")
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [analysis, setAnalysis] = useState<{
    overallScore: number
    categories: {
      nutrition: { score: number; status: string; trend: string }
      digestion: { score: number; status: string; trend: string }
      activity: { score: number; status: string; trend: string }
      hydration: { score: number; status: string; trend: string }
    }
    recommendations: string[]
    vetVisitRecommended: boolean
    vetVisitReason?: string
  } | null>(null)

  useEffect(() => {
    async function fetchPets() {
      try {
        const res = await fetch("/api/pets")
        const data = await res.json()
        setPets(data)
        if (data.length > 0) {
          setSelectedPet(data[0].id)
        }
      } catch (error) {
        console.error("Error fetching pets:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPets()
  }, [])

  useEffect(() => {
    if (selectedPet) {
      fetchHealthData()
    }
  }, [selectedPet, period])

  async function fetchHealthData() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/health-logs?petId=${selectedPet}&days=${period}`)
      const logs = await res.json()

      // Process logs into chart data
      const processed = logs.map((log: Record<string, unknown>) => ({
        date: new Date(log.date as string).toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        }),
        meals: (log.meals as Array<unknown>)?.length || 0,
        waterIntake: (log.waterIntake as number) || 0,
        eliminations: (log.eliminations as Array<unknown>)?.length || 0,
        walkMinutes:
          (log.activity as { walks?: Array<{ duration?: number }> })?.walks?.reduce(
            (acc: number, w: { duration?: number }) => acc + (w.duration || 0),
            0
          ) || 0,
        overallCondition: (log.overallCondition as number) || 3,
      }))

      setHealthData(processed.reverse())

      // Generate mock analysis
      generateMockAnalysis()
    } catch (error) {
      console.error("Error fetching health data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function generateMockAnalysis() {
    setAnalysis({
      overallScore: Math.floor(Math.random() * 20) + 75,
      categories: {
        nutrition: {
          score: Math.floor(Math.random() * 20) + 70,
          status: "good",
          trend: ["improving", "stable", "declining"][Math.floor(Math.random() * 3)],
        },
        digestion: {
          score: Math.floor(Math.random() * 20) + 75,
          status: "excellent",
          trend: "stable",
        },
        activity: {
          score: Math.floor(Math.random() * 20) + 65,
          status: "good",
          trend: "improving",
        },
        hydration: {
          score: Math.floor(Math.random() * 20) + 70,
          status: "fair",
          trend: "stable",
        },
      },
      recommendations: [
        "하루 권장 음수량을 채우도록 신선한 물을 자주 교체해주세요.",
        "식사 시간을 일정하게 유지하면 소화 건강에 도움이 됩니다.",
        "산책 시간을 조금 늘려보는 것을 권장합니다.",
      ],
      vetVisitRecommended: Math.random() > 0.7,
      vetVisitReason: "정기 건강검진 시기가 다가왔습니다.",
    })
  }

  async function runAIAnalysis() {
    setIsAnalyzing(true)
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId: selectedPet, days: parseInt(period) }),
      })
      const data = await res.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error("Error running AI analysis:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const selectedPetData = pets.find((p) => p.id === selectedPet)

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading && pets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dog className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">반려동물을 먼저 등록해주세요</h2>
            <Button asChild>
              <Link href="/pets/new">반려동물 등록하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">건강 리포트</h1>
          <p className="text-muted-foreground">AI 기반 건강 분석 리포트</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            options={pets.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: "7", label: "최근 7일" },
              { value: "14", label: "최근 14일" },
              { value: "30", label: "최근 30일" },
            ]}
          />
          <Button onClick={runAIAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            AI 분석
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      {analysis && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium opacity-90">
                  {selectedPetData?.name}의 건강 점수
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-5xl font-bold">{analysis.overallScore}</span>
                  <span className="text-2xl opacity-75">/ 100</span>
                </div>
              </div>
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center">
                {selectedPetData?.species === "DOG" ? (
                  <Dog className="h-12 w-12" />
                ) : (
                  <Cat className="h-12 w-12" />
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(analysis.categories).map(([key, value]) => (
                <div key={key} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key === "nutrition"
                        ? "영양"
                        : key === "digestion"
                        ? "소화"
                        : key === "activity"
                        ? "활동"
                        : "수분"}
                    </span>
                    {getTrendIcon(value.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold", getHealthScoreColor(value.score))}>
                      {value.score}
                    </span>
                    <Badge
                      variant={
                        value.status === "excellent"
                          ? "success"
                          : value.status === "good"
                          ? "secondary"
                          : "warning"
                      }
                    >
                      {value.status === "excellent"
                        ? "최상"
                        : value.status === "good"
                        ? "양호"
                        : "주의"}
                    </Badge>
                  </div>
                  <Progress
                    value={value.score}
                    className="h-1.5 mt-2"
                    indicatorClassName={getHealthScoreBgColor(value.score)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Condition Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              컨디션 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[1, 5]} className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="overallCondition"
                    stroke="#f97316"
                    fill="#fed7aa"
                    name="컨디션"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              활동량 (산책)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="walkMinutes" fill="#a855f7" name="산책 시간(분)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Meals & Hydration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="h-5 w-5 text-orange-500" />
              식사 & 음수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="meals"
                    stroke="#f97316"
                    name="식사 횟수"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="waterIntake"
                    stroke="#3b82f6"
                    name="음수량(ml)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Eliminations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              배변 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="eliminations" fill="#22c55e" name="배변 횟수" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI 건강 조언
            </CardTitle>
            <CardDescription>
              {selectedPetData?.name}의 건강 데이터를 분석한 맞춤 조언입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm">{rec}</p>
                </li>
              ))}
            </ul>

            {analysis.vetVisitRecommended && (
              <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-700">병원 방문 권장</p>
                    <p className="text-sm text-orange-600 mt-1">{analysis.vetVisitReason}</p>
                    <Button size="sm" className="mt-3" variant="outline">
                      주변 동물병원 찾기
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
