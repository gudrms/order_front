# Taco Mono

배달앱 · 테이블오더 · 관리자 · POS 통합 주문 모노레포 (pnpm + Turborepo)

## 앱 구성

| 앱 | 역할 | 포트 | 배포 |
|---|---|---|---|
| `apps/backend` | NestJS API 서버 | 4000 | Vercel (Serverless) |
| `apps/admin` | 점주 관리자 대시보드 | 3003 | Vercel |
| `apps/delivery-customer` | 배달 주문 앱 (PWA + Capacitor) | 3001 | Vercel |
| `apps/table-order` | 테이블 주문 태블릿 앱 | 3000 | Vercel |
| `apps/brand-website` | 브랜드 홈페이지 | 3002 | Vercel |
| `apps/admin-electron` | 관리자 데스크톱 앱 (Electron) | — | GitHub Releases |
| `apps/toss-pos-plugin` | Toss POS 연동 플러그인 (Vite) | 5173 | 플러그인 zip |

## 패키지

| 패키지 | 역할 |
|---|---|
| `packages/shared` | 공통 타입, API 클라이언트, stores, hooks |
| `packages/ui` | 공통 UI 컴포넌트 (Shadcn UI + Tailwind) |
| `packages/order-core` | 주문 계산/검증 비즈니스 로직 |
| `packages/config` | ESLint/TypeScript 공통 설정 |

## 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 세팅 (최초 1회)
cp all-in-one-shared.env.example all-in-one-shared.env.local
# 파일 열어서 실값 채우기
pnpm sync:env

# 3. 로컬 Supabase 시작 (선택)
pnpm supa:start

# 4. 개발 서버 실행
pnpm dev                              # 전체 (toss-pos-plugin 제외)
pnpm dev --filter=backend             # 백엔드만
pnpm dev --filter=admin               # 관리자만
pnpm --filter toss-pos-plugin dev     # POS 플러그인 (단독)
```

## 문서

- [로컬 환경 세팅](docs/setup.md) — env sync, Supabase, 실행 명령
- [배포 가이드](docs/deployment.md) — Vercel, GitHub Actions, 환경변수
- [시스템 아키텍처](docs/architecture.md) — 주문 흐름, 인증, MQ
- [API 문서](https://api.tacomole.kr/api/docs) — Scalar UI (운영)
- [작업 현황](checkList.md) — 미완료 항목 전체

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, TanStack Query, Zustand
- **Backend**: NestJS 10, Prisma 5, Supabase (PostgreSQL + Auth + Realtime), pgmq
- **결제**: Toss Payments, Toss POS
- **알림**: Firebase Cloud Messaging (FCM)
- **모니터링**: Sentry, Upstash Redis (Rate Limiting)
- **배포**: Vercel, GitHub Actions
