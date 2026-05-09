# Table Order Monorepo

테이블 오더 시스템 모노레포 (pnpm + Turborepo)

## 📁 프로젝트 구조

```
apps/
  ├── table-order/          # 📱 테이블 주문 (태블릿 웹앱)
  │   ├── src/app           # Next.js App Router
  │   └── src/features      # 기능별 모듈 (Cart, Menu)
  │
  ├── delivery-customer/    # 🛵 배달 주문 (PWA + Capacitor)
  │   ├── src/app           # Next.js App Router
  │   ├── android/          # Android Native Project
  │   └── ios/              # iOS Native Project
  │
  ├── brand-website/        # 🎨 브랜드 홈페이지 (마케팅)
  │   └── src/app           # Next.js SSG
  │
  ├── admin/                # 👨‍🍳 관리자 앱 (주방 화면, 대시보드)
  │   └── src/app           # Next.js Dashboard
  │
  ├── backend/              # ⚙️ 통합 백엔드 (NestJS)
  │   ├── src/modules       # 도메인 모듈 (Orders, Menus, POS Sync)
  │   └── prisma/           # DB 스키마
  │
  └── toss-pos-plugin/      # 🔌 Toss POS 연동 플러그인
      ├── src/              # Plugin Entry Point
      └── dist/             # Build Output (plugin.zip)
 
packages/
  ├── shared/               # 📦 공통 로직 (Type-safe)
  │   ├── src/types         # 공통 타입 (DTO)
  │   └── src/api           # API 클라이언트
  │
  ├── ui/                   # 🎨 공통 UI (Design System)
  │   └── src/components    # Shadcn UI + Tailwind
  │
  ├── order-core/           # 🧠 주문 핵심 로직
  │   └── src/hooks         # 장바구니, 주문 상태 관리
# Table Order Monorepo

테이블 오더 시스템 모노레포 (pnpm + Turborepo)

## 📁 프로젝트 구조

```
apps/
  ├── table-order/          # 📱 테이블 주문 (태블릿 웹앱)
  │   ├── src/app           # Next.js App Router
  │   └── src/features      # 기능별 모듈 (Cart, Menu)
  │
  ├── delivery-customer/    # 🛵 배달 주문 (PWA + Capacitor)
  │   ├── src/app           # Next.js App Router
  │   ├── android/          # Android Native Project
  │   └── ios/              # iOS Native Project
  │
  ├── brand-website/        # 🎨 브랜드 홈페이지 (마케팅)
  │   └── src/app           # Next.js SSG
  │
  ├── admin/                # 👨‍🍳 관리자 앱 (주방 화면, 대시보드)
  │   └── src/app           # Next.js Dashboard
  │
  ├── backend/              # ⚙️ 통합 백엔드 (NestJS)
  │   ├── src/modules       # 도메인 모듈 (Orders, Menus, POS Sync)
  │   └── prisma/           # DB 스키마
  │
  └── toss-pos-plugin/      # 🔌 Toss POS 연동 플러그인
      ├── src/              # Plugin Entry Point
      └── dist/             # Build Output (plugin.zip)
 
packages/
  ├── shared/               # 📦 공통 로직 (Type-safe)
  │   ├── src/types         # 공통 타입 (DTO)
  │   └── src/api           # API 클라이언트
  │
  ├── ui/                   # 🎨 공통 UI (Design System)
  │   └── src/components    # Shadcn UI + Tailwind
  │
  ├── order-core/           # 🧠 주문 핵심 로직
  │   └── src/hooks         # 장바구니, 주문 상태 관리
  │
  └── config/               # 🔧 공통 설정
      └── eslint, tsconfig  # 개발 환경 설정
```

## 🚀 시작하기

자세한 실행 및 빌드 방법은 **[실행 가이드 (run.md)](./run.md)**를 참고하세요.

### 퀵 스타트

```bash
# 1. 의존성 설치 (pnpm 필수)
pnpm install

# 2. 개발 서버 실행
pnpm dev
```

## 📦 패키지 설명

### Apps

| 앱 | 포트 | 설명 | 배포 |
|----|------|------|------|
| **table-order** | 3000 | 매장 내 테이블 주문 (태블릿) | Vercel |
| **delivery-customer** | 3001 | 배달 주문 (웹 + 향후 앱) | Vercel + App Store |
| **brand-website** | 3002 | 브랜드 마케팅 홈페이지 | Vercel (SSG) |
| **admin** | 3003 | 주방 화면 + 관리자 대시보드 | Vercel |
| **backend** | 4000 | NestJS API 서버 | Vercel Serverless |
| **toss-pos-plugin** | - | Toss POS 연동 플러그인 | Toss Place (ZIP) |

### Packages

| 패키지 | 설명 | 사용처 |
|--------|------|--------|
| **@order/shared** | 공통 타입, 유틸, 상수 | 모든 앱 |
| **@order/ui** | 공통 UI 컴포넌트 | table-order, delivery, admin, brand |
| **@order/order-core** | 주문 비즈니스 로직 (프론트) | table-order, delivery |
| **@order/config** | 공통 설정 파일 | 모든 앱 |

## 🏗️ 아키텍처

### 백엔드: Modular Monolith

```
apps/backend/src/modules/
  ├── table-order/      # 테이블 주문 전용
  ├── delivery/         # 배달 주문 전용
  ├── pos-sync/         # POS 연동 (Toss POS)
  ├── shared/           # 공통 (메뉴, 주문)
  └── brand-site/       # 브랜드 홈페이지 API
```

**왜 단일 백엔드?**
- 데이터 일관성 (메뉴, 재고 공유)
- 코드 재사용 (OrdersModule, MenusModule)
- Vercel Serverless에서 자동 격리

### POS 연동: Toss POS Plugin

모든 주문 채널(table-order, delivery-customer)의 주문이 Toss POS로 자동 전달됩니다.

```
┌─────────────────┐
│ table-order     │ 태블릿 주문
└────────┬────────┘
         │
         ├────→  ┌──────────────┐      ┌─────────────┐
         │       │   Backend    │ ←──→ │ toss-pos    │ ←──→ ┌─────────────┐
┌─────────────────┤   (NestJS)   │      │  -plugin    │      │ Toss POS    │
│ delivery        │   POS Sync   │      │  (중개자)   │      │ (매장 기기) │
│ -customer       │   Module     │      └──────────────┘      └─────────────┘
└─────────────────┘              │
                                 │
                   ┌─────────────┴─────────────┐
                   │ 주방 프린터 + 디스플레이  │
                   └───────────────────────────┘
```

**주문 흐름:**
1. 고객 주문 → Backend API
2. Backend → Toss POS Plugin (HTTP)
3. Plugin → Toss POS 기기
4. POS → 주방 프린터/디스플레이 출력

**배포 방식:**
- Backend, 프론트 앱들: Vercel 자동 배포
- Toss POS Plugin: ZIP으로 빌드 → Toss Place 개발자센터 수동 업로드

### 프론트엔드: 도메인별 분리

- **table-order**: 태블릿 전용 UI, 터치 최적화
- **delivery-customer**: 모바일 최적화, GPS, 푸시 알림
- **brand-website**: SEO 최적화, 정적 생성
- **admin**: Realtime Dashboard

## 🛠️ 기술 스택

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TailwindCSS 4 |
| **State** | Zustand, TanStack Query |
| **Backend** | NestJS 10, Prisma 5 |
| **Database** | Supabase (PostgreSQL 14) |
| **Realtime** | Supabase Realtime |
| **Error Monitoring** | Sentry (모든 앱 통합) |
| **Deployment** | Vercel (Serverless) |
| **Monorepo** | pnpm, Turborepo |

## 📱 배달앱 (delivery-customer)

### 특징
- ✅ **PWA**: 브라우저에서 접속, "홈 화면에 추가" 지원
- ✅ **Capacitor**: iOS/Android 네이티브 앱 빌드 가능
- ✅ **12개 Native 플러그인**: 카메라, GPS, 푸시 알림, 진동 등
- ✅ **배달 추적**: 실시간 배달 상태, 라이더 전화
- ✅ **마이페이지**: 주소 관리(Daum 우편번호), 찜한 메뉴, 주문 내역
- ✅ **결제**: 7개 결제 수단 (카드, 카카오페이, 네이버페이 등)

### 개발 & 배포

```bash
# 웹 개발 (평소처럼)
pnpm --filter delivery-customer dev

# Android 앱 빌드 (Windows 가능!)
cd apps/delivery-customer
pnpm cap:add:android
pnpm android

# iOS 앱 빌드 (Mac 필요)
pnpm cap:add:ios
pnpm ios
```

자세한 내용: [delivery-customer README](./apps/delivery-customer/README.md)

## 📚 문서

- [리팩토링 가이드](./REFACTORING.md)
- [기술 스펙](./docs/참고사항/tech_spec.md)
- [아키텍처 결정](./docs/ARCHITECTURE_DECISIONS.md)
- [QR 코드 주문 가이드](./docs/QR_ORDERING.md)
- [배달앱 기능 목록](./apps/delivery-customer/FEATURES.md)
- [Sentry 에러 모니터링](./docs/SENTRY_QUICK_START.md)

### 🚨 에러 모니터링 (Sentry)
각 앱에는 Sentry 연동 테스트를 위한 페이지가 준비되어 있습니다.
- **배달앱**: `/sentry/error`
- **브랜드**: `/sentry/error`
- **관리자**: `/sentry/error`
- **백엔드**: `/sentry/error` (API 호출 시 500 에러)

## 🎯 주요 기능

### table-order (테이블 주문)
- 📱 태블릿 주문
- 📲 QR 코드 주문 (스마트폰)
- 🛒 장바구니 (Zustand)
- 📦 주문 관리
- 🔔 직원 호출
- 🏪 다중 매장 지원

### delivery-customer (배달 주문)
- 🚚 실시간 배달 추적
- 📍 GPS 위치 (현재 위치 자동 입력)
- 💳 다양한 결제 수단
- 🔔 푸시 알림 (주문 상태)
- 📸 카메라 (리뷰 사진)
- 📳 진동 피드백

### admin (관리자)
- 🍳 주방 화면
- 📊 대시보드
- 📈 통계
- ⚙️ 설정

### backend (백엔드)
- 🔗 Toss POS 연동 (양방향 동기화)
- 📡 주문 → POS 전송
- 🔄 Realtime (Supabase)
- 🔒 보안 (Rate Limiting, Helmet)
- 📝 API 문서 (Scalar) — `https://api.tacomole.kr/api/docs`

## ⚠️ 중요: pnpm 필수!

이 프로젝트는 **pnpm 워크스페이스**를 사용합니다. 자세한 내용은 [실행 가이드](./run.md)를 확인하세요.

## 🚀 배포 전략

### 웹 배포 (Vercel)
```bash
git push origin main
# → Vercel이 자동으로 배포
```

### Android 앱 배포
```bash
cd apps/delivery-customer
pnpm cap:sync
pnpm cap:open:android
# Android Studio → Build → Generate Signed Bundle
# → Google Play Console 업로드
```

### iOS 앱 배포 (Mac 필요)
```bash
cd apps/delivery-customer
pnpm cap:sync
pnpm cap:open:ios
# Xcode → Product → Archive
# → App Store Connect 업로드
```

### Toss POS Plugin 배포
```bash
cd apps/toss-pos-plugin
pnpm build
# → dist/plugin.zip 생성
# → Toss Place 개발자센터에서 수동 업로드
# → https://place.toss.im/developer
```

## 🤝 기여하기

1. 브랜치 생성: `git checkout -b feature/new-feature`
2. 커밋: `git commit -m "Add new feature"`
3. 푸시: `git push origin feature/new-feature`
4. PR 생성

## 📄 라이선스

Private

## 🆘 문제 해결

[실행 가이드](./run.md#🆘-문제-해결-troubleshooting)를 참고하세요.

더 많은 정보: [REFACTORING.md](./REFACTORING.md)
