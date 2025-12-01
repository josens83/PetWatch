"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Crown,
  Check,
  X,
  Loader2,
  Sparkles,
  Dog,
  Cat,
  Brain,
  Zap,
  Shield,
  Users,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SubscriptionInfo {
  plan: "FREE" | "PREMIUM" | "PREMIUM_PLUS"
  status: string
  currentPeriodEnd: string
}

const PLANS = [
  {
    id: "free",
    name: "무료",
    price: 0,
    period: "영구",
    description: "기본 건강 관리 시작하기",
    features: [
      { text: "반려동물 1마리 등록", included: true },
      { text: "기본 건강 기록", included: true },
      { text: "주간 건강 요약", included: true },
      { text: "커뮤니티 접근", included: true },
      { text: "AI 분석 (제한적)", included: false },
      { text: "IoT 연동 무제한", included: false },
      { text: "실시간 알림", included: false },
    ],
    icon: Dog,
    popular: false,
  },
  {
    id: "premium",
    name: "프리미엄",
    price: 7900,
    yearlyPrice: 63000,
    period: "월",
    description: "AI 기반 완벽한 건강 관리",
    features: [
      { text: "반려동물 무제한 등록", included: true },
      { text: "AI 건강 분석 무제한", included: true },
      { text: "실시간 이상 감지 알림", included: true },
      { text: "IoT 기기 무제한 연동", included: true },
      { text: "상세 건강 리포트", included: true },
      { text: "동물병원 예약 & 기록 공유", included: true },
      { text: "광고 제거", included: true },
    ],
    icon: Crown,
    popular: true,
  },
  {
    id: "premium_plus",
    name: "프리미엄+",
    price: 14900,
    yearlyPrice: 119000,
    period: "월",
    description: "전문가 상담까지 한번에",
    features: [
      { text: "프리미엄 모든 기능", included: true },
      { text: "24시간 수의사 온라인 상담", included: true },
      { text: "펫보험 할인 연계", included: true },
      { text: "연간 건강검진 리마인더", included: true },
      { text: "프리미엄 펫시터 접근", included: true },
      { text: "가족 공유 (5명)", included: true },
      { text: "우선 고객 지원", included: true },
    ],
    icon: Sparkles,
    popular: false,
  },
]

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscription")
        const data = await res.json()
        setSubscription(data)
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubscription()
  }, [])

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(planId)
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingPeriod }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
    } finally {
      setIsProcessing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <Badge className="mb-4" variant="secondary">
          구독 관리
        </Badge>
        <h1 className="text-3xl font-bold mb-4">
          우리 아이 건강, AI가 24시간 지켜봐요
        </h1>
        <p className="text-muted-foreground">
          PetWatch 프리미엄으로 업그레이드하고 AI 기반 건강 분석, 실시간 알림,
          전문가 상담까지 모든 기능을 이용해보세요.
        </p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <Card className="max-w-md mx-auto border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">현재 플랜</p>
                <p className="text-xl font-bold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  {subscription.plan === "FREE"
                    ? "무료"
                    : subscription.plan === "PREMIUM"
                    ? "프리미엄"
                    : "프리미엄+"}
                </p>
              </div>
              {subscription.plan !== "FREE" && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">다음 결제일</p>
                  <p className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border p-1 bg-muted">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              billingPeriod === "monthly"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            월간 결제
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              billingPeriod === "yearly"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            연간 결제
            <Badge variant="success" className="ml-2 text-xs">
              33% 할인
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrentPlan =
            subscription?.plan === plan.id.toUpperCase() ||
            (subscription?.plan === "FREE" && plan.id === "free")
          const price =
            billingPeriod === "yearly" && plan.yearlyPrice
              ? plan.yearlyPrice
              : plan.price

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden",
                plan.popular && "border-primary shadow-lg"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                  인기
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      plan.popular ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <plan.icon
                      className={cn(
                        "h-5 w-5",
                        plan.popular ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">
                    {price === 0 ? "무료" : `₩${price.toLocaleString()}`}
                  </span>
                  {price > 0 && (
                    <span className="text-muted-foreground">
                      /{billingPeriod === "yearly" ? "년" : plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={
                          feature.included ? "" : "text-muted-foreground"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || isProcessing !== null}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isProcessing === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    "현재 플랜"
                  ) : plan.price === 0 ? (
                    "현재 플랜"
                  ) : (
                    "업그레이드"
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto pt-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          프리미엄 기능 미리보기
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Brain,
              title: "AI 건강 분석",
              description: "매일 기록을 분석하여 이상 징후를 조기에 발견합니다",
            },
            {
              icon: Zap,
              title: "실시간 알림",
              description: "건강 이상이 감지되면 즉시 알림을 보내드립니다",
            },
            {
              icon: Shield,
              title: "IoT 연동",
              description: "스마트 기기와 연동하여 자동으로 데이터를 수집합니다",
            },
            {
              icon: MessageSquare,
              title: "전문가 상담",
              description: "24시간 수의사와 온라인으로 상담할 수 있습니다",
            },
          ].map((feature, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto pt-12">
        <h2 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h2>
        <div className="space-y-4">
          {[
            {
              q: "언제든지 해지할 수 있나요?",
              a: "네, 언제든지 구독을 해지할 수 있습니다. 해지 후에도 결제 기간이 끝날 때까지 프리미엄 기능을 이용하실 수 있습니다.",
            },
            {
              q: "무료 플랜과 프리미엄의 차이는 무엇인가요?",
              a: "무료 플랜은 1마리의 반려동물만 등록 가능하고 AI 분석 기능이 제한됩니다. 프리미엄은 무제한 등록, AI 분석, 실시간 알림 등 모든 기능을 이용하실 수 있습니다.",
            },
            {
              q: "결제는 어떻게 하나요?",
              a: "신용카드, 체크카드, 카카오페이 등 다양한 결제 수단을 지원합니다. 연간 결제 시 33% 할인이 적용됩니다.",
            },
          ].map((faq, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
