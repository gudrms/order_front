# Taco Mono

배달 주문, 테이블 주문, 관리자, POS 연동, 백엔드를 함께 관리하는 pnpm + Turborepo 기반 모노레포입니다.

## 서비스 구성

| 경로 | 역할 | 로컬 포트 | 배포 |
|---|---|---:|---|
| `apps/backend` | NestJS API 서버 | 4000 | Vercel Serverless |
| `apps/admin` | 점주/관리자 대시보드 | 3003 | Vercel |
| `apps/delivery-customer` | 배달 주문 앱 | 3001 | Vercel, Android 앱 |
| `apps/table-order` | 매장 테이블 주문 앱 | 3000 | Vercel |
| `apps/brand-website` | 브랜드 웹사이트 | 3002 | Vercel |
| `apps/admin-electron` | 관리자 데스크톱 앱 | - | GitHub Releases |
| `apps/toss-pos-plugin` | Toss POS 연동 플러그인 | 5173 | 플러그인 zip |

## 패키지 구성

| 경로 | 역할 |
|---|---|
| `packages/shared` | 공통 타입, API 클라이언트, 훅, 유틸 |
| `packages/ui` | 공통 React UI 컴포넌트 |
| `packages/order-core` | 주문 계산/검증 로직과 장바구니 스토어 |
| `packages/config` | 공통 ESLint/TypeScript 설정 |

## 빠른 시작

```bash
pnpm install
cp all-in-one-shared.env.example all-in-one-shared.env.local
pnpm sync:env
pnpm dev
```

개별 실행:

```bash
pnpm dev --filter=backend
pnpm dev --filter=admin
pnpm dev --filter=delivery-customer
pnpm dev --filter=table-order
pnpm --filter toss-pos-plugin dev
```

## 주요 문서

| 문서 | 내용 |
|---|---|
| [로컬 환경 설정](docs/setup.md) | env 동기화, Supabase, 로컬 실행 |
| [배포 가이드](docs/deployment.md) | Vercel, GitHub Actions, 선택 배포 |
| [운영자 인수인계](docs/operator-handoff.md) | 장애 대응, 운영 엔드포인트, cron 확인 |
| [테스트 시나리오](docs/test-scenarios.md) | 관리자/배달/테이블오더 수동 테스트 흐름 |
| [시스템 아키텍처](docs/architecture.md) | 주문 흐름, 인증, 큐 구조 |
| [작업 체크리스트](checkList.md) | 출시 전 진행 상태 |
| [API 문서](https://api.tacomole.kr/api/docs) | 운영 API Scalar UI |

도메인별 상세 문서는 각 앱과 패키지 README를 기준으로 관리합니다.

## 기술 스택

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand
- Backend: NestJS 10, Prisma 5, Supabase(PostgreSQL/Auth/Realtime), pgmq
- Payment: Toss Payments, Toss POS 연동
- Notification: Firebase Cloud Messaging
- Monitoring: Sentry, Vercel Logs, GitHub Actions
- Deploy: Vercel, GitHub Actions
