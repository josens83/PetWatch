"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Utensils,
  Droplets,
  Activity,
  Dog,
  Cat,
  Loader2,
  Check,
  MapPin,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Pet {
  id: string
  name: string
  species: "DOG" | "CAT"
}

export default function QuickHealthLogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get("type") || "meal"
  const petIdParam = searchParams.get("pet")

  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<string>(petIdParam || "")
  const [activeTab, setActiveTab] = useState(initialType)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPets, setIsLoadingPets] = useState(true)
  const [success, setSuccess] = useState(false)

  // Meal form
  const [mealData, setMealData] = useState({
    type: "BREAKFAST",
    amount: "",
    consumedPercent: "100",
    enthusiasm: "3",
    foodBrand: "",
    foodProduct: "",
    notes: "",
  })

  // Elimination form
  const [eliminationData, setEliminationData] = useState({
    type: "FECES",
    fecesConsistency: "4",
    fecesColor: "brown",
    urineColor: "yellow",
    urineAmount: "normal",
    straining: false,
    notes: "",
  })

  // Walk form
  const [walkData, setWalkData] = useState({
    duration: "",
    distance: "",
    poopCount: "0",
    peeCount: "0",
    notes: "",
  })

  // Water form
  const [waterData, setWaterData] = useState({
    amount: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchPets() {
      try {
        const res = await fetch("/api/pets")
        const data = await res.json()
        setPets(data)
        if (data.length > 0 && !petIdParam) {
          setSelectedPet(data[0].id)
        }
      } catch (error) {
        console.error("Error fetching pets:", error)
      } finally {
        setIsLoadingPets(false)
      }
    }
    fetchPets()
  }, [petIdParam])

  const handleSubmit = async () => {
    if (!selectedPet) return

    setIsLoading(true)
    setSuccess(false)

    try {
      let endpoint = ""
      let body: Record<string, unknown> = { petId: selectedPet }

      switch (activeTab) {
        case "meal":
          endpoint = "/api/health-logs/meal"
          body = {
            ...body,
            type: mealData.type,
            amount: parseInt(mealData.amount),
            consumedPercent: parseInt(mealData.consumedPercent),
            enthusiasm: parseInt(mealData.enthusiasm),
            foodBrand: mealData.foodBrand || null,
            foodProduct: mealData.foodProduct || null,
            notes: mealData.notes || null,
          }
          break
        case "elimination":
          endpoint = "/api/health-logs/elimination"
          body = {
            ...body,
            type: eliminationData.type,
            fecesConsistency:
              eliminationData.type === "FECES"
                ? parseInt(eliminationData.fecesConsistency)
                : null,
            fecesColor:
              eliminationData.type === "FECES" ? eliminationData.fecesColor : null,
            urineColor:
              eliminationData.type === "URINE" ? eliminationData.urineColor : null,
            urineAmount:
              eliminationData.type === "URINE" ? eliminationData.urineAmount : null,
            straining: eliminationData.straining,
            notes: eliminationData.notes || null,
          }
          break
        case "walk":
          endpoint = "/api/health-logs/walk"
          body = {
            ...body,
            duration: parseInt(walkData.duration),
            distance: walkData.distance ? parseFloat(walkData.distance) : null,
            poopCount: parseInt(walkData.poopCount),
            peeCount: parseInt(walkData.peeCount),
            notes: walkData.notes || null,
          }
          break
        case "water":
          endpoint = "/api/health-logs/water"
          body = {
            ...body,
            amount: parseInt(waterData.amount),
            notes: waterData.notes || null,
          }
          break
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Failed to save")

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error("Error saving log:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPetData = pets.find((p) => p.id === selectedPet)

  if (isLoadingPets) {
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
            <p className="text-muted-foreground mb-4">
              건강 기록을 남기려면 먼저 반려동물을 등록해야 합니다.
            </p>
            <Button asChild>
              <Link href="/pets/new">반려동물 등록하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">기록이 저장되었습니다!</h2>
            <p className="text-muted-foreground">
              {selectedPetData?.name}의 건강 기록이 저장되었어요.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">빠른 건강 기록</h1>
        <p className="text-muted-foreground">오늘의 건강 상태를 기록해주세요</p>
      </div>

      {/* Pet Selection */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">반려동물 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => setSelectedPet(pet.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap",
                  selectedPet === pet.id
                    ? pet.species === "DOG"
                      ? "border-blue-500 bg-blue-50"
                      : "border-purple-500 bg-purple-50"
                    : "border-muted hover:border-primary/50"
                )}
              >
                {pet.species === "DOG" ? (
                  <Dog className={cn("h-5 w-5", selectedPet === pet.id ? "text-blue-500" : "text-muted-foreground")} />
                ) : (
                  <Cat className={cn("h-5 w-5", selectedPet === pet.id ? "text-purple-500" : "text-muted-foreground")} />
                )}
                <span className={cn("font-medium", selectedPet === pet.id ? "" : "text-muted-foreground")}>
                  {pet.name}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="meal" className="flex items-center gap-1.5">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">식사</span>
          </TabsTrigger>
          <TabsTrigger value="water" className="flex items-center gap-1.5">
            <Droplets className="h-4 w-4" />
            <span className="hidden sm:inline">음수</span>
          </TabsTrigger>
          <TabsTrigger value="elimination" className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">배변</span>
          </TabsTrigger>
          <TabsTrigger value="walk" className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">산책</span>
          </TabsTrigger>
        </TabsList>

        {/* Meal Tab */}
        <TabsContent value="meal">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-orange-500" />
                식사 기록
              </CardTitle>
              <CardDescription>오늘 먹은 음식을 기록해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>식사 종류</Label>
                <Select
                  value={mealData.type}
                  onChange={(e) => setMealData({ ...mealData, type: e.target.value })}
                  options={[
                    { value: "BREAKFAST", label: "아침" },
                    { value: "LUNCH", label: "점심" },
                    { value: "DINNER", label: "저녁" },
                    { value: "SNACK", label: "간식" },
                    { value: "TREAT", label: "트릿" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>급여량 (g)</Label>
                  <Input
                    type="number"
                    placeholder="예: 50"
                    value={mealData.amount}
                    onChange={(e) => setMealData({ ...mealData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>섭취율 (%)</Label>
                  <Select
                    value={mealData.consumedPercent}
                    onChange={(e) => setMealData({ ...mealData, consumedPercent: e.target.value })}
                    options={[
                      { value: "100", label: "100% (전부)" },
                      { value: "75", label: "75%" },
                      { value: "50", label: "50% (절반)" },
                      { value: "25", label: "25%" },
                      { value: "0", label: "거의 안 먹음" },
                    ]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>식욕 (1-5)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMealData({ ...mealData, enthusiasm: n.toString() })}
                      className={cn(
                        "flex-1 py-2 rounded-lg border-2 transition-all",
                        mealData.enthusiasm === n.toString()
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  placeholder="특이사항이 있다면 기록해주세요"
                  value={mealData.notes}
                  onChange={(e) => setMealData({ ...mealData, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Water Tab */}
        <TabsContent value="water">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                음수량 기록
              </CardTitle>
              <CardDescription>오늘 마신 물의 양을 기록해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>음수량 (ml)</Label>
                <Input
                  type="number"
                  placeholder="예: 200"
                  value={waterData.amount}
                  onChange={(e) => setWaterData({ ...waterData, amount: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  일반적으로 체중 1kg당 40-60ml가 적정량입니다
                </p>
              </div>
              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  placeholder="특이사항이 있다면 기록해주세요"
                  value={waterData.notes}
                  onChange={(e) => setWaterData({ ...waterData, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Elimination Tab */}
        <TabsContent value="elimination">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                배변 기록
              </CardTitle>
              <CardDescription>배변 상태를 기록해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>종류</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEliminationData({ ...eliminationData, type: "FECES" })}
                    className={cn(
                      "py-3 rounded-lg border-2 transition-all",
                      eliminationData.type === "FECES"
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    대변
                  </button>
                  <button
                    onClick={() => setEliminationData({ ...eliminationData, type: "URINE" })}
                    className={cn(
                      "py-3 rounded-lg border-2 transition-all",
                      eliminationData.type === "URINE"
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    소변
                  </button>
                </div>
              </div>

              {eliminationData.type === "FECES" && (
                <>
                  <div className="space-y-2">
                    <Label>대변 상태 (1-7)</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <button
                          key={n}
                          onClick={() =>
                            setEliminationData({ ...eliminationData, fecesConsistency: n.toString() })
                          }
                          className={cn(
                            "flex-1 py-2 rounded border-2 text-sm transition-all",
                            eliminationData.fecesConsistency === n.toString()
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-primary/50"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1: 매우 딱딱 / 4: 정상 / 7: 물변
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>대변 색상</Label>
                    <Select
                      value={eliminationData.fecesColor}
                      onChange={(e) =>
                        setEliminationData({ ...eliminationData, fecesColor: e.target.value })
                      }
                      options={[
                        { value: "brown", label: "갈색 (정상)" },
                        { value: "black", label: "검은색" },
                        { value: "red", label: "빨간색/혈변" },
                        { value: "yellow", label: "노란색" },
                        { value: "green", label: "녹색" },
                        { value: "white", label: "흰색/회색" },
                      ]}
                    />
                  </div>
                </>
              )}

              {eliminationData.type === "URINE" && (
                <>
                  <div className="space-y-2">
                    <Label>소변 색상</Label>
                    <Select
                      value={eliminationData.urineColor}
                      onChange={(e) =>
                        setEliminationData({ ...eliminationData, urineColor: e.target.value })
                      }
                      options={[
                        { value: "clear", label: "투명" },
                        { value: "yellow", label: "노란색 (정상)" },
                        { value: "dark", label: "진한 노란색" },
                        { value: "orange", label: "주황색" },
                        { value: "red", label: "붉은색/혈뇨" },
                        { value: "cloudy", label: "탁함" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>소변량</Label>
                    <Select
                      value={eliminationData.urineAmount}
                      onChange={(e) =>
                        setEliminationData({ ...eliminationData, urineAmount: e.target.value })
                      }
                      options={[
                        { value: "small", label: "적음" },
                        { value: "normal", label: "보통" },
                        { value: "large", label: "많음" },
                      ]}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="straining"
                  checked={eliminationData.straining}
                  onChange={(e) =>
                    setEliminationData({ ...eliminationData, straining: e.target.checked })
                  }
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="straining" className="font-normal cursor-pointer">
                  힘주는 모습이 보임 (배변 시 불편해 보임)
                </Label>
              </div>

              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  placeholder="특이사항이 있다면 기록해주세요"
                  value={eliminationData.notes}
                  onChange={(e) => setEliminationData({ ...eliminationData, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Walk Tab */}
        <TabsContent value="walk">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-500" />
                산책 기록
              </CardTitle>
              <CardDescription>산책 정보를 기록해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4" />
                    산책 시간 (분)
                  </Label>
                  <Input
                    type="number"
                    placeholder="예: 30"
                    value={walkData.duration}
                    onChange={(e) => setWalkData({ ...walkData, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    거리 (km)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="예: 1.5"
                    value={walkData.distance}
                    onChange={(e) => setWalkData({ ...walkData, distance: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>대변 횟수</Label>
                  <Select
                    value={walkData.poopCount}
                    onChange={(e) => setWalkData({ ...walkData, poopCount: e.target.value })}
                    options={[0, 1, 2, 3, 4, 5].map((n) => ({
                      value: n.toString(),
                      label: `${n}회`,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>소변 횟수</Label>
                  <Select
                    value={walkData.peeCount}
                    onChange={(e) => setWalkData({ ...walkData, peeCount: e.target.value })}
                    options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
                      value: n.toString(),
                      label: `${n}회`,
                    }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  placeholder="산책 중 특이사항이 있다면 기록해주세요"
                  value={walkData.notes}
                  onChange={(e) => setWalkData({ ...walkData, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="mt-6">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isLoading || !selectedPet}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              기록 저장
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
