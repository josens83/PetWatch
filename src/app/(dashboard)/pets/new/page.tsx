"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dog, Cat, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { DOG_BREEDS, CAT_BREEDS } from "@/lib/breed-data"
import { cn } from "@/lib/utils"
import Link from "next/link"

type Step = 1 | 2 | 3

export default function NewPetPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Form data
  const [formData, setFormData] = useState({
    species: "" as "DOG" | "CAT" | "",
    name: "",
    breed: "",
    customBreed: "",
    birthDate: "",
    gender: "" as "MALE" | "FEMALE" | "",
    neutered: false,
    weight: "",
    size: "" as "SMALL" | "MEDIUM" | "LARGE" | "GIANT" | "",
    furColor: "",
    distinctiveFeatures: "",
    activityLevel: "MODERATE" as "LOW" | "MODERATE" | "HIGH",
    dietType: "DRY_FOOD" as "DRY_FOOD" | "WET_FOOD" | "RAW" | "HOMEMADE" | "PRESCRIPTION" | "MIXED",
    allergies: "",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          breed: formData.breed === "기타 (직접 입력)" ? formData.customBreed : formData.breed,
          weight: parseFloat(formData.weight),
          allergies: formData.allergies
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "반려동물 등록에 실패했습니다.")
      }

      router.push(`/pets/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) {
      return formData.species && formData.name && formData.breed && formData.birthDate && formData.gender
    }
    if (step === 2) {
      return formData.weight && formData.size
    }
    return true
  }

  const breeds = formData.species === "DOG" ? DOG_BREEDS : formData.species === "CAT" ? CAT_BREEDS : []

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/pets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">새 반려동물 등록</h1>
        <p className="text-muted-foreground">반려동물의 정보를 입력해주세요</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                s < step
                  ? "bg-primary text-primary-foreground"
                  : s === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "h-1 flex-1 mx-2 rounded",
                  s < step ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>반려동물의 기본 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Species Selection */}
            <div className="space-y-2">
              <Label>종류 *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleChange("species", "DOG")}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    formData.species === "DOG"
                      ? "border-blue-500 bg-blue-50"
                      : "border-muted hover:border-blue-300"
                  )}
                >
                  <Dog
                    className={cn(
                      "h-12 w-12",
                      formData.species === "DOG" ? "text-blue-500" : "text-muted-foreground"
                    )}
                  />
                  <span className={formData.species === "DOG" ? "font-medium text-blue-600" : ""}>
                    강아지
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("species", "CAT")}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    formData.species === "CAT"
                      ? "border-purple-500 bg-purple-50"
                      : "border-muted hover:border-purple-300"
                  )}
                >
                  <Cat
                    className={cn(
                      "h-12 w-12",
                      formData.species === "CAT" ? "text-purple-500" : "text-muted-foreground"
                    )}
                  />
                  <span className={formData.species === "CAT" ? "font-medium text-purple-600" : ""}>
                    고양이
                  </span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="예: 뽀삐"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            {/* Breed */}
            {formData.species && (
              <div className="space-y-2">
                <Label htmlFor="breed">품종 *</Label>
                <Select
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => handleChange("breed", e.target.value)}
                  options={breeds.map((b) => ({ value: b.breed, label: b.breed }))}
                  placeholder="품종을 선택해주세요"
                />
                {formData.breed === "기타 (직접 입력)" && (
                  <Input
                    placeholder="품종을 직접 입력해주세요"
                    value={formData.customBreed}
                    onChange={(e) => handleChange("customBreed", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일 *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>성별 *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleChange("gender", "MALE")}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    formData.gender === "MALE"
                      ? "border-blue-500 bg-blue-50 text-blue-600 font-medium"
                      : "border-muted hover:border-blue-300"
                  )}
                >
                  남아
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("gender", "FEMALE")}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    formData.gender === "FEMALE"
                      ? "border-pink-500 bg-pink-50 text-pink-600 font-medium"
                      : "border-muted hover:border-pink-300"
                  )}
                >
                  여아
                </button>
              </div>
            </div>

            {/* Neutered */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="neutered"
                checked={formData.neutered}
                onChange={(e) => handleChange("neutered", e.target.checked)}
                className="h-5 w-5 rounded border-gray-300"
              />
              <Label htmlFor="neutered" className="font-normal cursor-pointer">
                중성화 완료
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Physical Info */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>신체 정보</CardTitle>
            <CardDescription>반려동물의 신체 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">체중 (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="예: 3.5"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
              />
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label>크기 *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "SMALL", label: "소형", desc: "~7kg" },
                  { value: "MEDIUM", label: "중형", desc: "7~18kg" },
                  { value: "LARGE", label: "대형", desc: "18~35kg" },
                  { value: "GIANT", label: "초대형", desc: "35kg~" },
                ].map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => handleChange("size", size.value)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center",
                      formData.size === size.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <div>{size.label}</div>
                    <div className="text-xs text-muted-foreground">{size.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fur Color */}
            <div className="space-y-2">
              <Label htmlFor="furColor">털 색상</Label>
              <Input
                id="furColor"
                placeholder="예: 흰색, 갈색 등"
                value={formData.furColor}
                onChange={(e) => handleChange("furColor", e.target.value)}
              />
            </div>

            {/* Distinctive Features */}
            <div className="space-y-2">
              <Label htmlFor="distinctiveFeatures">특이 사항</Label>
              <Textarea
                id="distinctiveFeatures"
                placeholder="예: 왼쪽 귀에 검은 점이 있음"
                value={formData.distinctiveFeatures}
                onChange={(e) => handleChange("distinctiveFeatures", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Lifestyle */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>생활 패턴</CardTitle>
            <CardDescription>반려동물의 생활 패턴을 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Activity Level */}
            <div className="space-y-2">
              <Label>활동량</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "LOW", label: "낮음", desc: "대부분 휴식" },
                  { value: "MODERATE", label: "보통", desc: "적당한 활동" },
                  { value: "HIGH", label: "높음", desc: "활발한 활동" },
                ].map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => handleChange("activityLevel", level.value)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-center",
                      formData.activityLevel === level.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <div>{level.label}</div>
                    <div className="text-xs text-muted-foreground">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Diet Type */}
            <div className="space-y-2">
              <Label>식이 유형</Label>
              <Select
                value={formData.dietType}
                onChange={(e) => handleChange("dietType", e.target.value)}
                options={[
                  { value: "DRY_FOOD", label: "건식 사료" },
                  { value: "WET_FOOD", label: "습식 사료" },
                  { value: "RAW", label: "생식" },
                  { value: "HOMEMADE", label: "자연식 (수제)" },
                  { value: "PRESCRIPTION", label: "처방식" },
                  { value: "MIXED", label: "혼합" },
                ]}
              />
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label htmlFor="allergies">알레르기</Label>
              <Input
                id="allergies"
                placeholder="예: 닭고기, 밀 (쉼표로 구분)"
                value={formData.allergies}
                onChange={(e) => handleChange("allergies", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                알레르기가 있다면 쉼표(,)로 구분하여 입력해주세요
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep((prev) => (prev - 1) as Step)}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          이전
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((prev) => (prev + 1) as Step)} disabled={!canProceed()}>
            다음
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                등록 완료
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
