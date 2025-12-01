import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dog,
  Cat,
  Heart,
  Brain,
  Bell,
  LineChart,
  Smartphone,
  Shield,
  Star,
  ArrowRight,
  Check,
} from "lucide-react"

const features = [
  {
    icon: Heart,
    title: "종합 건강 기록",
    description:
      "식사, 배변, 활동량, 체중 등 반려동물의 모든 건강 데이터를 한 곳에서 관리하세요.",
  },
  {
    icon: Brain,
    title: "AI 건강 분석",
    description:
      "축적된 데이터를 AI가 분석하여 이상 징후를 조기에 발견하고 맞춤 케어 조언을 제공합니다.",
  },
  {
    icon: Bell,
    title: "실시간 알림",
    description:
      "식사 시간, 약 복용, 병원 예약 등 중요한 일정을 놓치지 않도록 알려드립니다.",
  },
  {
    icon: LineChart,
    title: "건강 리포트",
    description:
      "주간/월간 건강 리포트로 우리 아이의 건강 변화를 한눈에 파악하세요.",
  },
  {
    icon: Smartphone,
    title: "IoT 기기 연동",
    description:
      "스마트 급식기, 체중계, 활동량계 등 IoT 기기와 연동하여 자동으로 데이터를 수집합니다.",
  },
  {
    icon: Shield,
    title: "동물병원 연결",
    description:
      "주변 동물병원 검색, 예약, 건강 기록 공유까지 한 번에 처리하세요.",
  },
]

const testimonials = [
  {
    name: "김민지",
    pet: "말티즈 '뭉치' 보호자",
    content:
      "매일 기록하기 귀찮았는데 PetWatch로 간편하게 기록하고 있어요. AI 분석으로 식욕 저하를 미리 알아챌 수 있었어요!",
    rating: 5,
  },
  {
    name: "이준호",
    pet: "골든 리트리버 '해피' 보호자",
    content:
      "산책 기록과 체중 관리가 정말 편해졌어요. 그래프로 한눈에 볼 수 있어서 좋습니다.",
    rating: 5,
  },
  {
    name: "박서연",
    pet: "러시안 블루 '루나' 보호자",
    content:
      "고양이 화장실 사용 패턴을 기록했더니 방광염 초기 증상을 발견할 수 있었어요. 정말 감사해요!",
    rating: 5,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dog className="h-7 w-7 text-blue-500" />
            <span className="text-xl font-bold text-primary">PetWatch</span>
            <Cat className="h-7 w-7 text-purple-500" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              기능
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              요금제
            </Link>
            <Link
              href="#testimonials"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              후기
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/register">무료로 시작하기</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          AI 기반 반려동물 건강관리 플랫폼
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          우리 아이 건강,
          <br />
          <span className="text-primary">AI가 24시간</span> 지켜봐요
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          식사, 배변, 활동량을 기록하고 AI 분석으로 건강 이상을 조기에 발견하세요.
          반려동물과 더 오래, 더 건강하게 함께할 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">
              무료로 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">기능 살펴보기</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
          {[
            { value: "50,000+", label: "등록된 반려동물" },
            { value: "1,000,000+", label: "건강 기록" },
            { value: "98%", label: "사용자 만족도" },
            { value: "500+", label: "제휴 동물병원" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">모든 건강 관리를 한 곳에서</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            PetWatch는 반려동물의 건강을 종합적으로 관리할 수 있는 모든 기능을
            제공합니다.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">합리적인 요금제</h2>
            <p className="text-muted-foreground">
              무료로 시작하고, 필요할 때 업그레이드하세요
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">무료</h3>
                <p className="text-3xl font-bold mb-4">
                  ₩0<span className="text-sm font-normal text-muted-foreground">/월</span>
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "반려동물 1마리 등록",
                    "기본 건강 기록",
                    "주간 건강 요약",
                    "커뮤니티 접근",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">무료로 시작</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>인기</Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">프리미엄</h3>
                <p className="text-3xl font-bold mb-4">
                  ₩7,900<span className="text-sm font-normal text-muted-foreground">/월</span>
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "반려동물 무제한 등록",
                    "AI 건강 분석 무제한",
                    "실시간 이상 감지 알림",
                    "IoT 기기 무제한 연동",
                    "상세 건강 리포트",
                    "광고 제거",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/register">프리미엄 시작</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium+ */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">프리미엄+</h3>
                <p className="text-3xl font-bold mb-4">
                  ₩14,900<span className="text-sm font-normal text-muted-foreground">/월</span>
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "프리미엄 모든 기능",
                    "24시간 수의사 온라인 상담",
                    "펫보험 할인 연계",
                    "프리미엄 펫시터 접근",
                    "가족 공유 (5명)",
                    "우선 고객 지원",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/register">프리미엄+ 시작</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">보호자들의 후기</h2>
          <p className="text-muted-foreground">
            PetWatch와 함께 반려동물 건강을 관리하는 보호자들의 이야기
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.pet}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            무료로 가입하고 반려동물의 건강을 체계적으로 관리해보세요.
            AI가 24시간 함께 지켜드립니다.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              무료로 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Dog className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-bold text-primary">PetWatch</span>
                <Cat className="h-6 w-6 text-purple-500" />
              </Link>
              <p className="text-sm text-muted-foreground">
                AI 기반 반려동물 건강관리 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">기능</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">요금제</Link></li>
                <li><Link href="/download" className="hover:text-foreground">앱 다운로드</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">회사 소개</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">채용</Link></li>
                <li><Link href="/press" className="hover:text-foreground">보도자료</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/support" className="hover:text-foreground">고객센터</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 PetWatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
