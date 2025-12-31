# 🍽️ Table Order System

> 태블릿 기반 무인 주문 시스템 (Tablet Self-Order Kiosk System)

## 📋 프로젝트 개요

테이블에 배치된 태블릿에서 고객이 직접 메뉴를 선택하고 주문할 수 있는 무인 주문 시스템입니다. Next.js Frontend와 NestJS Backend로 구성된 풀스택 모노레포 프로젝트입니다.

### 🎯 주요 기능

- 📱 **태블릿 주문**: 테이블별 태블릿에서 메뉴 조회 및 주문
- 🛒 **장바구니**: 실시간 장바구니 관리 (Zustand)
- 📦 **주문 관리**: 주문 생성, 조회, 상태 관리
- 🔔 **직원 호출**: 테이블에서 직원 호출 기능
- 🏪 **매장 관리**: 다중 매장/지점 지원
- 🔗 **OKPOS 연동**: POS 시스템 연동 (준비중)

---

## 🏗️ 프로젝트 구조

```
order_front/
├── apps/
│   ├── frontend/          # Next.js 15 (App Router)
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router
│   │   │   ├── components/       # UI 컴포넌트 (Presenter)
│   │   │   ├── features/         # 기능별 모듈 (Container)
│   │   │   ├── stores/           # Zustand 상태 관리
│   │   │   ├── lib/              # 유틸리티 함수
│   │   │   └── mocks/            # MSW Mock 데이터
│   │   └── tests/                # Vitest 테스트
│   │
│   └── backend/           # NestJS 10
│       ├── src/
│       │   ├── modules/          # NestJS 모듈
│       │   │   ├── menus/       # 메뉴 관리
│       │   │   ├── orders/      # 주문 처리
│       │   │   ├── stores/      # 매장 관리
│       │   │   ├── auth/        # 인증
│       │   │   └── integrations/# OKPOS 연동
│       │   ├── common/           # 공통 모듈
│       │   │   ├── filters/     # Exception Filter
│       │   │   ├── guards/      # Rate Limiting
│       │   │   └── logger/      # Winston Logger
│       │   └── prisma/           # Prisma ORM
│       └── tests/                # 백엔드 테스트
│
├── packages/
│   └── shared/            # 공통 타입/상수 패키지
│       ├── src/
│       │   ├── types/            # 공통 타입 정의
│       │   ├── constants/        # 공통 상수
│       │   └── utils/            # 공통 유틸리티
│       └── package.json
│
└── docs/                  # 프로젝트 문서
    └── 참고사항/
        ├── CHECKLIST.md              # 개발 체크리스트
        ├── 환경변수_설정_가이드.md    # 환경 변수 가이드
        └── Vercel_배포_가이드.md      # 배포 가이드
```

---

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **State**: Zustand, TanStack Query (React Query)
- **Testing**: Vitest, Testing Library
- **Mock API**: MSW (Mock Service Worker)
- **Build**: Webpack, SWC

### Backend
- **Framework**: NestJS 10 (TypeScript)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5
- **Auth**: Passport JWT
- **Validation**: class-validator
- **Documentation**: Swagger
- **Logging**: Winston
- **Security**: Helmet.js, Rate Limiting (@nestjs/throttler)

### DevOps
- **Hosting**: Vercel (Frontend + Backend Serverless)
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics

---

## 🔧 설치 및 실행

### 필수 요구사항

- Node.js 18.x 이상
- pnpm 8.x 이상
- PostgreSQL (Supabase)

### 1. 저장소 클론

```bash
git clone <repository-url>
cd order_front
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

#### Backend (.env)
```bash
# apps/backend/.env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NODE_ENV=development
```

#### Frontend (.env.local)
```bash
# apps/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK=true
```

자세한 환경 변수 설정: [환경변수 설정 가이드](docs/참고사항/환경변수_설정_가이드.md)

### 4. 데이터베이스 마이그레이션

```bash
pnpm --filter=backend prisma:generate
pnpm --filter=backend prisma:push
```

### 5. 개발 서버 실행

```bash
# 전체 실행 (Frontend + Backend - 병렬)
pnpm dev

# Frontend만 실행
pnpm --filter=frontend dev

# Backend만 실행
pnpm --filter=backend dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

---

## 📦 빌드 및 배포

### 로컬 빌드

```bash
# 전체 빌드 (모든 워크스페이스)
pnpm build

# Frontend 빌드
pnpm --filter=frontend build

# Backend 빌드
pnpm --filter=backend build
```

### Vercel 배포

자세한 배포 가이드: [Vercel 배포 가이드](docs/참고사항/Vercel_배포_가이드.md)

**배포 URL**:
- Frontend: https://order-front-frontend.vercel.app
- Backend: https://order-front-backend.vercel.app

---

## 🧪 테스트

### Frontend 테스트 (Vitest)

```bash
# 테스트 실행
pnpm --filter=frontend test

# UI 모드
pnpm --filter=frontend test:ui

# 커버리지
pnpm --filter=frontend test:coverage
```

**테스트 현황**: 24개 테스트 전체 통과 ✅
- `cartStore`: 13개 테스트
- `CartItemCard`: 11개 테스트

### Backend 테스트

```bash
pnpm --filter=backend test
```

---

## 🔒 보안 기능

프로젝트는 프로덕션 레벨의 보안을 갖추고 있습니다:

### Rate Limiting (DDoS 방지)
- 1초당 10개 요청 제한
- 1분당 100개 요청 제한
- 15분당 1000개 요청 제한

### Helmet.js (보안 헤더)
- XSS Protection
- Clickjacking 방지
- Content Security Policy

### CORS 정책
- 프로덕션: Frontend URL만 허용
- 개발: localhost 자동 허용

### Input Validation
- `class-validator`로 DTO 검증
- `whitelist`, `forbidNonWhitelisted` 설정

### 에러 처리
- HttpExceptionFilter (스택 트레이스 숨김)
- Winston Logger (Supabase 에러 로깅)
- ErrorBoundary (Frontend)

---

## 📚 주요 문서

- [개발 체크리스트](docs/참고사항/CHECKLIST.md)
- [환경 변수 설정 가이드](docs/참고사항/환경변수_설정_가이드.md)
- [Vercel 배포 가이드](docs/참고사항/Vercel_배포_가이드.md)
- [Frontend README](apps/frontend/README.md)
- [Backend README](apps/backend/README.md)

---

## 🎯 주요 기능 상세

### 1. 주문 플로우

```
1. 테이블 태블릿 접속 (/tacomolly/gimpo/menu)
2. 메뉴 카테고리 선택
3. 메뉴 상세보기 (옵션 선택)
4. 장바구니 추가
5. 주문하기
6. 주문 완료 (주문번호 표시)
```

### 2. 상태 관리

**Frontend (Zustand)**:
- `cartStore`: 장바구니 상태
- `errorStore`: 에러 상태

**Backend (Prisma + PostgreSQL)**:
- 주문 상태: PENDING → ACCEPTED → PREPARING → READY → DELIVERED
- 실시간 동기화 (TanStack Query)

### 3. Container/Presenter 패턴

UI 컴포넌트와 비즈니스 로직 분리:
- `components/ui/`: Presenter (props만 받음)
- `features/*/components/`: Container (Zustand, API 호출)

---

## 🛠️ 개발 도구

### VS Code 확장 프로그램 (권장)

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense

### 유용한 명령어

```bash
# Prisma Studio (DB GUI)
pnpm --filter=backend prisma studio

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 테스트
pnpm test
```

---

## 🐛 문제 해결

### CORS 에러
```bash
# Backend 환경 변수 확인
FRONTEND_URL=https://order-front-frontend.vercel.app
```

### Database 연결 실패
```bash
# Supabase Connection Pooler 활성화 확인
# DATABASE_URL에 pgbouncer=true 포함 확인
```

### Rate Limiting 에러 (429)
```bash
# apps/backend/src/app.module.ts
# limit 값 조정 (개발 환경)
```

---

## 📝 라이선스

MIT License

---

## 👥 기여자

프로젝트 개발: Claude AI + Human Developer

---

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.
