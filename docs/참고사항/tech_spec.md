# 🛠️ Technical Specification (Tech Spec)

> **Stack**: Next.js 14 + NestJS 10 + Prisma 5 + Supabase  
> **Deployment**: Vercel (Serverless)  
> **Last Updated**: 2024-12-28

---

## 📋 목차

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Infrastructure](#3-infrastructure)
4. [OKPOS Integration](#4-okpos-integration)
5. [Realtime Communication](#5-realtime-communication)
6. [Development Environment](#6-development-environment)
7. [Deployment Strategy](#7-deployment-strategy)
8. [Cost & Scalability](#8-cost--scalability)

---

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     고객 (테이블 태블릿)                         │
│                  QR 코드 스캔 → 메뉴 주문                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 14 Frontend (Vercel Edge)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - 고객용 UI: 메뉴 조회, 장바구니, 주문                  │  │
│  │  - 관리자 UI: 주방 화면, 대시보드                        │  │
│  │  - Supabase Client: Realtime 구독                       │  │
│  │  - TanStack Query: API 상태 관리                        │  │
│  │  - Zustand: 클라이언트 상태 관리                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (axios)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         NestJS 10 Backend (Vercel Serverless Functions)         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Modules:                                                │  │
│  │  - OrdersModule: 주문 생성/조회/상태 변경               │  │
│  │  - MenusModule: 메뉴 CRUD, 품절 처리                   │  │
│  │  - OkposModule: OKPOS API 연동                          │  │
│  │  - PrismaModule: Database ORM                           │  │
│  │                                                          │  │
│  │  Services:                                               │  │
│  │  - OkposService: axios-retry, Circuit Breaker          │  │
│  │  - OrderService: 주문 로직 + OKPOS 전송                │  │
│  │                                                          │  │
│  │  Scheduler:                                              │  │
│  │  - @Cron('0 3 * * *'): 메뉴 동기화 (매일 새벽 3시)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────┬────────────────────┬─────────────────────────┘
                   │                    │
                   │ Prisma             │ axios
                   ▼                    ▼
    ┌──────────────────────────┐  ┌────────────────────────┐
    │   Supabase Platform      │  │   OKPOS O2O API        │
    │  ┌────────────────────┐  │  │ dum.okpos.co.kr        │
    │  │ PostgreSQL 14      │  │  │                        │
    │  │ - 12 Tables        │  │  │ - POST /order/create   │
    │  │ - JSONB Support    │  │  │ - GET /menu/items      │
    │  │ - Full-text Search │  │  │ - GET /order/{id}      │
    │  └────────────────────┘  │  └────────────────────────┘
    │  ┌────────────────────┐  │
    │  │ Realtime (LISTEN)  │  │
    │  │ - WebSocket 대체   │  │
    │  │ - 주문 알림 전송   │  │
    │  └────────────────────┘  │
    │  ┌────────────────────┐  │
    │  │ Storage (S3 호환)  │  │
    │  │ - 메뉴 이미지      │  │
    │  │ - 로고, 아이콘     │  │
    │  └────────────────────┘  │
    └──────────────────────────┘
```

### 1.2 Data Flow (주문 생성 시나리오)

```
1. 고객 테이블 태블릿에서 주문 완료 버튼 클릭
   ↓
2. Next.js → POST /api/v1/orders
   { tableId, items: [{ menuId, quantity, options }] }
   ↓
3. NestJS OrderController 수신
   ↓
4. OrderService.createOrder()
   ├─ Prisma로 DB에 주문 저장
   ├─ OKPOS API 호출 (비동기)
   │  → 성공: okposOrderId 업데이트
   │  → 실패: failed_okpos_orders 테이블에 저장
   └─ 응답 반환: { success: true, orderId }
   ↓
5. Supabase Realtime 자동 발동
   - PostgreSQL NOTIFY 트리거
   - 구독 중인 주방 화면으로 실시간 알림
   ↓
6. 주방 화면에서 새 주문 알림 수신
   - 소리 재생 + Toast 알림
   - 주문 목록에 추가
```

---

## 2. Technology Stack

### 2.1 Stack Comparison (Spring → NestJS)

| Layer               | 기존 (Spring Boot) | 변경 (NestJS)       | 이유                     |
| :------------------ | :----------------- | :------------------ | :----------------------- |
| **Framework**       | Spring Boot 3.x    | NestJS 10.x         | TypeScript 풀스택 통일   |
| **Language**        | Java 17+           | TypeScript 5.x      | 타입 공유, 생산성 향상   |
| **ORM**             | JPA + QueryDSL     | Prisma 5.x          | 타입 안전성, 간결한 쿼리 |
| **DB**              | NCP Cloud DB       | Supabase PostgreSQL | 무료 tier, Realtime 내장 |
| **Realtime**        | WebSocket (STOMP)  | Supabase Realtime   | 백엔드 코드 불필요       |
| **Storage**         | NCP Object Storage | Supabase Storage    | 통합 관리, 무료 tier     |
| **Deployment**      | NCP Server         | Vercel Serverless   | 자동 배포, 관리 제로     |
| **Retry**           | Spring Retry       | axios-retry         | 동일한 재시도 로직       |
| **Circuit Breaker** | Resilience4j       | opossum             | 동일한 장애 대응         |
| **Scheduler**       | @Scheduled         | @Cron()             | 동일한 스케줄링          |
| **API Docs**        | SpringDoc          | @nestjs/swagger     | 동일한 Swagger           |

### 2.2 Technology Stack Detail

| Layer          | Technology       | Version | Purpose                      |
| :------------- | :--------------- | :------ | :--------------------------- |
| **Frontend**   | Next.js          | 14.x    | SSR + CSR 하이브리드         |
|                | React            | 18.x    | UI 컴포넌트                  |
|                | TypeScript       | 5.x     | 타입 안전성                  |
|                | TailwindCSS      | 3.x     | 유틸리티 우선 스타일링       |
|                | Shadcn UI        | Latest  | UI 컴포넌트 라이브러리       |
|                | Zustand          | 4.x     | 클라이언트 상태 관리         |
|                | TanStack Query   | 5.x     | 서버 상태 관리               |
| **Backend**    | NestJS           | 10.x    | TypeScript 백엔드 프레임워크 |
|                | Prisma           | 5.x     | Type-safe ORM                |
|                | axios            | 1.x     | HTTP 클라이언트              |
|                | axios-retry      | 4.x     | API 재시도 로직              |
|                | opossum          | 8.x     | Circuit Breaker 패턴         |
|                | @nestjs/schedule | 4.x     | Cron 스케줄러                |
| **Database**   | Supabase         | -       | PostgreSQL 14 + Realtime     |
| **Deployment** | Vercel           | -       | Edge Network + Serverless    |
| **Monitoring** | Vercel Analytics | -       | 성능 모니터링                |

### 2.3 NestJS vs Spring Boot 구조 비교

| Spring Boot       | NestJS                         | 설명                 |
| :---------------- | :----------------------------- | :------------------- |
| `@RestController` | `@Controller()`                | REST API 엔드포인트  |
| `@Service`        | `@Injectable()`                | 비즈니스 로직 서비스 |
| `@Autowired`      | `constructor(private service)` | 의존성 주입          |
| `@RequestMapping` | `@Get()`, `@Post()`            | HTTP 라우팅          |
| `@RequestBody`    | `@Body()`                      | 요청 바디 파싱       |
| `@PathVariable`   | `@Param()`                     | URL 경로 변수        |
| `@RequestParam`   | `@Query()`                     | 쿼리 파라미터        |
| `@Component`      | `@Module()`                    | 모듈 정의            |
| `@Scheduled`      | `@Cron()`                      | 스케줄링             |

---

## 3. Infrastructure

### 3.1 Vercel Platform

**Frontend 배포**:

- **위치**: Vercel Edge Network (전세계 CDN)
- **빌드**: Static Export + Server Components
- **도메인**: 자동 HTTPS (Let's Encrypt)
- **배포**: `git push` 시 자동 배포

**Backend 배포** (Serverless Functions):

- **런타임**: Node.js 20.x
- **메모리**: 1024MB
- **실행 시간**: 10초 (Hobby), 60초 (Pro)
- **Cold Start**: ~200-500ms

### 3.2 Supabase Platform

**PostgreSQL Database**:

- **버전**: PostgreSQL 14.x
- **용량**: 500MB (Free), 8GB (Pro)
- **기능**: JSONB, Full-text Search, Foreign Keys
- **백업**: 자동 일일 백업 (7일 보관)
- **Connection**: pgBouncer 내장

**Realtime**:

- **프로토콜**: PostgreSQL LISTEN/NOTIFY
- **지연시간**: ~100ms
- **동시 연결**: 200개 (Free), 500개 (Pro)

**Storage**:

- **용량**: 1GB (Free), 100GB (Pro)
- **타입**: S3 호환 Object Storage
- **CDN**: 전세계 Edge 캐싱

### 3.3 Infrastructure Comparison

| 항목          | 기존 (NCP)              | 변경 (Vercel + Supabase)       |
| :------------ | :---------------------- | :----------------------------- |
| **Frontend**  | NCP Server              | Vercel Edge Network            |
| **Backend**   | NCP Server (2vCPU, 4GB) | Vercel Serverless (1GB 메모리) |
| **Database**  | NCP Cloud DB (Micro)    | Supabase PostgreSQL            |
| **Storage**   | NCP Object Storage      | Supabase Storage               |
| **SSL**       | 수동 설정               | 자동 발급                      |
| **배포**      | GitHub Actions          | git push 자동                  |
| **모니터링**  | 수동 설정               | Vercel Analytics 내장          |
| **비용 (월)** | ~₩95,000                | ₩0 (Free tier)                 |

---

## 4. OKPOS Integration

### 4.1 OKPOS API Endpoints

| API             | Method | Purpose        | Timing        |
| :-------------- | :----- | :------------- | :------------ |
| `/order/create` | POST   | 주문 전송      | 주문 생성 시  |
| `/menu/items`   | GET    | 메뉴 동기화    | 매일 새벽 3시 |
| `/order/{id}`   | GET    | 주문 상태 조회 | 필요 시       |

**Base URL**: `https://dum.okpos.co.kr/api`  
**인증**: API Key (Header)

### 4.2 Retry & Circuit Breaker

**axios-retry** (Spring Retry 대체):

- 재시도 횟수: 3회
- 재시도 간격: Exponential Backoff (2초 → 4초 → 8초)
- 재시도 조건: Network Error, 5xx Error

**opossum** (Resilience4j 대체):

- Timeout: 30초
- Error Threshold: 50%
- Reset Timeout: 60초
- 상태: OPEN → HALF-OPEN → CLOSE

### 4.3 Error Handling

**실패 시 처리**:

1. `failed_okpos_orders` 테이블에 저장
2. 스케줄러로 5분마다 재시도
3. 3회 실패 시 관리자 알림

---

## 5. Realtime Communication

### 5.1 WebSocket vs Supabase Realtime

| 항목          | Spring WebSocket           | Supabase Realtime        |
| :------------ | :------------------------- | :----------------------- |
| **구현**      | Backend에서 서버 구현 필요 | Backend 코드 불필요      |
| **프로토콜**  | STOMP over WebSocket       | PostgreSQL LISTEN/NOTIFY |
| **연결 관리** | 직접 관리                  | Supabase 자동 관리       |
| **재연결**    | 직접 구현                  | 자동 재연결              |
| **지연시간**  | ~50-100ms                  | ~100ms                   |

### 5.2 Realtime Channels

| Channel          | Event                 | Purpose        |
| :--------------- | :-------------------- | :------------- |
| `kitchen_orders` | INSERT on orders      | 신규 주문 알림 |
| `order_updates`  | UPDATE on orders      | 주문 상태 변경 |
| `staff_calls`    | INSERT on staff_calls | 직원 호출 알림 |

---

## 6. Development Environment

### 6.1 Required Tools

- Node.js v20.x (LTS)
- npm or pnpm (최신 버전)
- Git (버전 관리)
- VSCode (권장 IDE)
- Prisma Extension (DB 스키마 관리)

### 6.2 Project Structure

```
table-order/
├── frontend/                 # Next.js 14
│   ├── app/
│   │   ├── (customer)/      # 고객용 UI
│   │   ├── (admin)/         # 관리자용 UI
│   │   └── api/             # (옵션) API Routes
│   ├── components/
│   ├── lib/
│   └── package.json
│
├── backend/                  # NestJS 10
│   ├── src/
│   │   ├── modules/
│   │   │   ├── orders/
│   │   │   ├── menus/
│   │   │   ├── okpos/
│   │   │   └── prisma/
│   │   ├── common/
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── docs/
```

### 6.3 Environment Variables

**Frontend (.env.local)**:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

**Backend (.env)**:

```bash
DATABASE_URL=
DIRECT_URL=
SUPABASE_SERVICE_KEY=
OKPOS_API_KEY=
OKPOS_BASE_URL=
```

---

## 7. Deployment Strategy

### 7.1 Deployment Flow

```
git push origin main
   ↓
Vercel 자동 감지
   ├─ Frontend Build (Next.js) → Edge Network 배포
   └─ Backend Build (NestJS) → Serverless 배포
   ↓
Prisma Migration 자동 실행
   ↓
배포 완료 (3-5분)
```

### 7.2 Environment Management

| Environment     | Branch    | URL                              | Database         |
| :-------------- | :-------- | :------------------------------- | :--------------- |
| **Development** | `dev`     | `dev.table-order.vercel.app`     | Supabase Dev     |
| **Staging**     | `staging` | `staging.table-order.vercel.app` | Supabase Staging |
| **Production**  | `main`    | `table-order.vercel.app`         | Supabase Prod    |

---

## 8. Cost & Scalability

### 8.1 Free Tier Limits

**Vercel (Hobby)**:

- 대역폭: 100GB/월
- 빌드 시간: 6,000분/월
- Serverless: 100GB-시간/월

**Supabase (Free)**:

- Database: 500MB
- 대역폭: 2GB/월
- Realtime: 200 동시 연결
- Storage: 1GB

### 8.2 Usage Estimation (70 테이블)

```
월간 주문 수: 5,250개 (70 테이블 × 3회/일 × 25일)

[Vercel]
- 페이지 로딩: 23.6GB
- API 호출: 0.95GB
→ 총 24.6GB (100GB의 24.6%) ✅

[Supabase]
- DB 월간 증가: 32MB
- 1년 누적: 384MB (500MB의 76.8%) ✅
- Realtime 연결: 15개 (200개의 7.5%) ✅
```

**결론: 70개 테이블은 완전 무료 tier로 충분!**

### 8.3 Scaling Scenarios

| 규모       | 테이블 수 | Vercel       | Supabase  | 월 비용 |
| :--------- | :-------- | :----------- | :-------- | :------ |
| **현재**   | 70        | Hobby (무료) | Free      | ₩0      |
| **확장 1** | 150       | Hobby (무료) | Free      | ₩0      |
| **확장 2** | 300       | Pro ($20)    | Pro ($25) | ₩60,000 |

### 8.4 Tier Upgrade Point

- **Vercel Pro**: 대역폭 100GB 초과 시 → **약 280 테이블** (28개 매장)
- **Supabase Pro**: DB 500MB 초과 시 → **약 15개월 후** (아카이빙으로 지연 가능)

---

## 📊 Summary

| 항목         | 기존 (NCP)  | 변경 (Vercel + Supabase) | 개선 효과          |
| :----------- | :---------- | :----------------------- | :----------------- |
| **Backend**  | Spring Boot | NestJS                   | TypeScript 풀스택  |
| **ORM**      | JPA         | Prisma                   | 타입 안전성 향상   |
| **Realtime** | WebSocket   | Supabase Realtime        | 백엔드 코드 불필요 |
| **배포**     | 수동 (SSH)  | 자동 (git push)          | 배포 시간 90% 단축 |
| **비용**     | ₩95,000/월  | ₩0/월                    | 100% 절감          |
| **확장**     | 수동 스케일 | 자동 스케일              | 무한 확장 가능     |
