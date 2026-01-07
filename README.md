# Table Order Monorepo

테이블 오더 시스템 모노레포 (pnpm + Turborepo)

## 📁 프로젝트 구조

```
apps/
  ├── table-order/          # 테이블 주문 (태블릿 웹앱)
  ├── delivery-customer/    # 배달 주문 (PWA → 향후 Capacitor 앱)
  ├── brand-website/        # 브랜드 홈페이지 (마케팅)
  ├── admin/                # 관리자 앱 (주방 화면, 대시보드)
  └── backend/              # 통합 백엔드 (NestJS)

packages/
  ├── shared/               # 공통 타입, 유틸, 상수
  ├── ui/                   # 공통 UI 컴포넌트
  ├── order-core/           # 주문 관련 프론트엔드 비즈니스 로직
  └── config/               # 공통 설정 (ESLint, TSConfig)
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 20.x
- **pnpm 10.x** (필수!)

### pnpm 설치

```bash
# 방법 1: npm으로 설치
npm install -g pnpm

# 방법 2: Corepack 사용 (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

### 의존성 설치

```bash
# ⚠️ npm이 아닌 pnpm 사용!
pnpm install
```

### 개발 서버 실행

```bash
# 모든 앱 동시 실행
pnpm dev

# 특정 앱만 실행
pnpm --filter table-order dev         # localhost:3000
pnpm --filter delivery-customer dev   # localhost:3001
pnpm --filter brand-website dev       # localhost:3002
pnpm --filter admin dev               # localhost:3003
pnpm --filter backend dev             # localhost:4000
```

### 빌드

```bash
# 모든 앱 빌드
pnpm build

# 특정 앱만 빌드
pnpm --filter table-order build
```

### QR 코드 생성 (테이블 주문용)

```bash
# 개발 서버 실행 후
# 브라우저에서 접속: http://localhost:3000/qr-generator.html

# 매장 정보 입력 후 QR 코드 생성 및 인쇄
```

자세한 내용: [QR 코드 주문 가이드](./docs/QR_ORDERING.md)

## 📦 패키지 설명

### Apps

| 앱 | 포트 | 설명 | 배포 |
|----|------|------|------|
| **table-order** | 3000 | 매장 내 테이블 주문 (태블릿) | Vercel |
| **delivery-customer** | 3001 | 배달 주문 (웹 + 향후 앱) | Vercel + App Store |
| **brand-website** | 3002 | 브랜드 마케팅 홈페이지 | Vercel (SSG) |
| **admin** | 3003 | 주방 화면 + 관리자 대시보드 | Vercel |
| **backend** | 4000 | NestJS API 서버 | Vercel Serverless |

### Packages

| 패키지 | 설명 | 사용처 |
|--------|------|--------|
| **@order/shared** | 공통 타입, 유틸, 상수 | 모든 앱 |
| **@order/ui** | 공통 UI 컴포넌트 | table-order, delivery, admin, brand |
| **@order/order-core** | 주문 비즈니스 로직 (프론트) | table-order, delivery |
| **@order/config** | 공통 설정 파일 | 모든 앱 |

## 🏗️ 아키텍처

### 백엔드: Modular Monolith

```typescript
apps/backend/src/modules/
  ├── table-order/      # 테이블 주문 전용
  ├── delivery/         # 배달 주문 전용
  ├── shared/           # 공통 (메뉴, 주문, OKPOS)
  └── brand-site/       # 브랜드 홈페이지 API
```

**왜 단일 백엔드?**
- 데이터 일관성 (메뉴, 재고 공유)
- 코드 재사용 (OrdersModule, MenusModule)
- Vercel Serverless에서 자동 격리

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
| **Deployment** | Vercel (Serverless) |
| **Monorepo** | pnpm, Turborepo |

## 📱 배달앱 (delivery-customer)

### 특징
- ✅ **PWA**: 브라우저에서 접속, "홈 화면에 추가" 지원
- ✅ **Capacitor**: iOS/Android 네이티브 앱 빌드 가능
- ✅ **12개 Native 플러그인**: 카메라, GPS, 푸시 알림, 진동 등
- ✅ **배달 추적**: 실시간 배달 상태, 라이더 전화
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

## 🔧 유용한 명령어

```bash
# 의존성 추가
pnpm --filter table-order add lodash
pnpm --filter @order/ui add clsx

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 테스트
pnpm test

# 클린
pnpm clean
```

## 📚 문서

- [리팩토링 가이드](./REFACTORING.md)
- [기술 스펙](./docs/참고사항/tech_spec.md)
- [아키텍처 결정](./docs/ARCHITECTURE_DECISIONS.md)
- [QR 코드 주문 가이드](./docs/QR_ORDERING.md)
- [배달앱 기능 목록](./apps/delivery-customer/FEATURES.md)

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
- 🔗 OKPOS 연동
- 🔄 Realtime (Supabase)
- 🔒 보안 (Rate Limiting, Helmet)
- 📝 Swagger API 문서

## ⚠️ 중요: pnpm 필수!

이 프로젝트는 **pnpm 워크스페이스**를 사용합니다.

```bash
# ❌ 작동 안 함
npm install

# ✅ 올바른 방법
pnpm install
```

**이유**: `workspace:*` 프로토콜은 pnpm 전용입니다.

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

## 🤝 기여하기

1. 브랜치 생성: `git checkout -b feature/new-feature`
2. 커밋: `git commit -m "Add new feature"`
3. 푸시: `git push origin feature/new-feature`
4. PR 생성

## 📄 라이선스

Private

## 🆘 문제 해결

### pnpm이 없다는 에러
```bash
npm install -g pnpm
```

### workspace:* 에러
```bash
# npm 대신 pnpm 사용
pnpm install
```

### 모듈을 찾을 수 없음 (@order/*)
```bash
# 루트에서 재설치
pnpm install
```

### Capacitor 빌드 실패
```bash
cd apps/delivery-customer
pnpm cap:sync
```

더 많은 정보: [REFACTORING.md](./REFACTORING.md)
