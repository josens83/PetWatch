import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { petId, message, history } = body

    // Verify ownership and get pet info
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        ownerId: session.user.id,
      },
      include: {
        healthConditions: true,
        medications: true,
        healthLogs: {
          orderBy: { date: "desc" },
          take: 7,
          include: {
            meals: true,
            eliminations: true,
            activity: true,
          },
        },
      },
    })

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    // Check subscription for AI features
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    // Free plan limits (mock implementation)
    const isPremium = subscription?.plan !== "FREE"

    // Build context for AI
    const petContext = `
반려동물 정보:
- 이름: ${pet.name}
- 종: ${pet.species === "DOG" ? "강아지" : "고양이"}
- 품종: ${pet.breed}
- 나이: ${calculateAge(pet.birthDate)}
- 체중: ${pet.weight}kg
- 성별: ${pet.gender === "MALE" ? "남아" : "여아"}
- 중성화: ${pet.neutered ? "완료" : "미완료"}
- 기존 건강 상태: ${pet.healthConditions.map((h) => h.name).join(", ") || "없음"}
- 복용 중인 약: ${pet.medications.map((m) => m.name).join(", ") || "없음"}
- 활동량: ${pet.activityLevel}
- 식이 유형: ${pet.dietType}
    `.trim()

    // Generate AI response (mock implementation)
    // In production, this would call Claude API
    const response = await generateAIResponse(petContext, message, history, isPremium)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in AI chat:", error)
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    )
  }
}

function calculateAge(birthDate: Date): string {
  const now = new Date()
  const birth = new Date(birthDate)
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  return years > 0 ? `${years}년 ${months}개월` : `${months}개월`
}

async function generateAIResponse(
  petContext: string,
  message: string,
  history: { role: string; content: string }[],
  isPremium: boolean
): Promise<string> {
  // Mock AI response - In production, call Claude API
  // This is a simplified version for demonstration

  const lowerMessage = message.toLowerCase()

  // Simulated responses based on keywords
  if (lowerMessage.includes("밥") || lowerMessage.includes("먹") || lowerMessage.includes("식사")) {
    return `반려동물의 식욕 변화는 다양한 원인이 있을 수 있습니다.

**일반적인 원인:**
1. 스트레스나 환경 변화
2. 사료 변경
3. 더운 날씨
4. 건강 문제

**확인해보세요:**
- 다른 증상(구토, 설사, 무기력함)이 있나요?
- 간식이나 다른 음식은 먹나요?
- 최근 환경 변화가 있었나요?

**조치 방법:**
- 신선한 물을 항상 제공해주세요
- 사료를 조금 따뜻하게 데워보세요
- 조용하고 편안한 환경에서 식사하게 해주세요

2-3일 이상 지속되거나 다른 증상이 동반된다면 동물병원 방문을 권장합니다.

${!isPremium ? "\n💡 프리미엄 구독 시 더 자세한 맞춤 분석을 받으실 수 있습니다." : ""}`
  }

  if (lowerMessage.includes("구토") || lowerMessage.includes("토")) {
    return `구토는 반려동물에게 비교적 흔한 증상이지만, 원인 파악이 중요합니다.

**즉시 병원 방문이 필요한 경우:**
⚠️ 구토물에 피가 섞여 있는 경우
⚠️ 하루에 여러 번 반복되는 경우
⚠️ 무기력하거나 탈수 증상이 있는 경우
⚠️ 이물질을 삼켰을 가능성이 있는 경우

**경과 관찰이 가능한 경우:**
- 한두 번의 구토 후 정상적인 행동
- 식욕과 활력이 정상적인 경우

**응급 조치:**
1. 12시간 정도 금식 (물은 소량씩)
2. 이후 소화가 쉬운 음식 소량 제공
3. 구토 시간, 횟수, 내용물 기록

증상이 지속되면 반드시 수의사 상담을 받으세요.`
  }

  if (lowerMessage.includes("산책")) {
    return `산책은 반려동물의 신체적, 정신적 건강에 매우 중요합니다!

**권장 산책량:**
- 소형견: 하루 20-30분, 1-2회
- 중형견: 하루 30-60분, 1-2회
- 대형견: 하루 60-90분 이상

**산책 시 주의사항:**
1. 날씨에 맞게 조절 (더위, 추위)
2. 규칙적인 시간 유지
3. 리드줄 필수
4. 배변 봉투 지참
5. 물 준비

**좋은 산책 습관:**
- 출발 전 물 마시기
- 산책 중간 휴식
- 다양한 경로 탐험
- 사회화 기회 제공

반려동물의 나이, 건강 상태, 품종에 따라 적절히 조절해주세요.`
  }

  if (lowerMessage.includes("눈물")) {
    return `눈물자국은 많은 반려동물, 특히 소형견과 고양이에게 흔한 문제입니다.

**주요 원인:**
1. 눈물관 막힘
2. 알레르기
3. 눈 자극 (속눈썹, 먼지)
4. 안구 건조증
5. 치아/구강 문제

**관리 방법:**
- 하루 1-2회 부드러운 천으로 닦아주기
- 눈 주변 털 정리
- 알레르기 원인 제거
- 깨끗한 음수 제공

**병원 방문이 필요한 경우:**
- 눈곱이 노란색/녹색인 경우
- 눈이 충혈된 경우
- 눈을 자주 비비는 경우
- 갑자기 심해진 경우

원인에 따라 치료 방법이 다르므로 지속되면 안과 검진을 권장합니다.`
  }

  if (lowerMessage.includes("물") && lowerMessage.includes("많")) {
    return `갑작스러운 음수량 증가는 주의가 필요한 증상입니다.

**주요 원인:**
1. 더운 날씨, 운동 후 (정상)
2. 염분 많은 음식 섭취 (정상)
3. 당뇨병
4. 신장 질환
5. 쿠싱 증후군
6. 요로 감염

**확인 사항:**
- 소변량도 증가했나요?
- 식욕이나 체중 변화가 있나요?
- 최근 사료나 간식 변경이 있었나요?

**권장 사항:**
⚠️ 갑작스러운 음수량 증가가 2-3일 이상 지속되면 수의사 상담을 권장합니다.

혈액검사와 소변검사로 원인을 파악할 수 있습니다.`
  }

  // Default response
  return `안녕하세요! ${message}에 대해 질문해주셨네요.

반려동물 건강에 대한 구체적인 상담을 위해 다음 정보를 알려주시면 더 정확한 답변을 드릴 수 있습니다:

1. 언제부터 이런 증상이 있었나요?
2. 다른 동반 증상이 있나요?
3. 최근 변화된 것이 있나요? (환경, 사료, 생활 패턴 등)

건강과 관련된 질문이시라면, 증상의 심각성에 따라 동물병원 방문이 필요할 수 있습니다.

무엇이든 편하게 질문해주세요! 🐕🐈`
}
