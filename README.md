# PetWatch - AI 반려동물 건강관리 플랫폼

"우리 아이 건강, AI가 24시간 지켜봐요"

PetWatch는 AI 기반 반려동물 종합 건강관리 플랫폼입니다. 식사, 배변, 활동량을 기록하고 AI 분석으로 건강 이상을 조기에 발견하세요.

## 주요 기능

- **반려동물 프로필 관리**: 강아지/고양이 프로필, 품종별 건강 정보
- **건강 기록**: 식사, 배변, 산책, 음수량 등 일일 건강 기록
- **AI 건강 분석**: 축적된 데이터를 AI가 분석하여 이상 징후 조기 발견
- **건강 리포트**: 주간/월간 건강 리포트 및 트렌드 차트
- **AI 건강 상담**: 24시간 AI 건강 상담 챗봇
- **구독 관리**: 무료/프리미엄/프리미엄+ 플랜

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui 스타일 커스텀 컴포넌트
- **State Management**: Zustand, React Query
- **Charts**: Recharts
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Claude API (건강 상담, 분석)

## 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 데이터베이스
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/josens83/PetWatch.git
cd PetWatch

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값 입력

# 데이터베이스 설정
npm run db:push

# 개발 서버 실행
npm run dev
```

### 환경 변수

`.env` 파일에 다음 변수들을 설정하세요:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/petwatch"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ANTHROPIC_API_KEY=""
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── providers/        # 컨텍스트 프로바이더
├── lib/                   # 유틸리티 및 설정
├── types/                 # TypeScript 타입 정의
└── hooks/                 # 커스텀 훅
```

## 구독 플랜

| 기능 | 무료 | 프리미엄 (₩7,900/월) | 프리미엄+ (₩14,900/월) |
|------|------|---------------------|----------------------|
| 반려동물 등록 | 1마리 | 무제한 | 무제한 |
| 건강 기록 | O | O | O |
| AI 분석 | 제한적 | 무제한 | 무제한 |
| 실시간 알림 | X | O | O |
| IoT 연동 | 1개 | 무제한 | 무제한 |
| 수의사 상담 | X | X | O |

## 배포

### Vercel 배포

```bash
vercel
```

### Docker 배포

```bash
docker build -t petwatch .
docker run -p 3000:3000 petwatch
```

## 라이선스

MIT License

## 연락처

- 이메일: support@petwatch.kr
- 웹사이트: https://petwatch.kr
