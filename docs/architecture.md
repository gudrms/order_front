# 시스템 아키텍처

## 전체 구조

```
[고객 태블릿]      [배달앱 PWA/Android/iOS]   [관리자 대시보드]
      │                       │                       │
      ▼                       ▼                       ▼
┌────────────────────────────────────────────────────────┐
│  Next.js 16 프론트엔드 (Vercel)                         │
│                                                         │
│  apps/table-order      — 테이블 주문 (공개, 인증 없음) │
│  apps/delivery-customer — 배달 주문 (Supabase Auth)    │
│  apps/admin            — 관리자 (Supabase Auth)         │
│  apps/brand-website    — 브랜드 홈페이지               │
│                                                         │
│  공유 패키지:                                           │
│  @order/shared     타입, API 클라이언트, Supabase 클라이언트 │
│  @order/ui         Shadcn UI 기반 공통 컴포넌트         │
│  @order/order-core 주문 계산/검증 비즈니스 로직         │
└──────────────────────────┬─────────────────────────────┘
                           │ REST API (Fetch)
                           ▼
┌────────────────────────────────────────────────────────┐
│  NestJS 10 백엔드 (Vercel Serverless)                   │
│  api.tacomole.kr/api/v1                                 │
│                                                         │
│  /api/v1/*  → api/index.ts  (maxDuration: 30s)          │
│  /api/v1/queue/* → api/queue.ts (maxDuration: 60s)      │
└──────────┬──────────────────────────┬───────────────────┘
           │ Prisma 5                  │ pgmq (PostgreSQL)
           ▼                           ▼
┌──────────────────┐       ┌──────────────────────────────┐
│  Supabase        │       │  QueueConsumerService         │
│  PostgreSQL      │       │  큐명: backend_events         │
│                  │       │  이벤트: order.paid,          │
│  Supabase Auth   │       │  pos.send_order,              │
│  Supabase        │       │  notification.send 등         │
│  Realtime        │       └──────────┬───────────────────┘
│  Supabase Storage│                  │
└──────────────────┘       ┌──────────▼───────────┐  ┌──────────────┐
                           │  Toss POS (okpos) API │  │  FCM (Firebase│
                           └──────────────────────┘  │  Cloud Messaging│
                                                     └──────────────┘
```

---

## 앱별 역할 및 인증

| 앱 | 대상 | 인증 | 로컬 포트 |
|---|---|---|---|
| table-order | 테이블 고객 (키오스크) | 없음 (storeId + tableNumber) | 3000 |
| delivery-customer | 배달 고객 | Supabase JWT | 3001 |
| admin | 매장 관리자 | Supabase JWT | 3003 |
| brand-website | 방문자 | 없음 | 3002 |
| backend | - | - | 4000 |

---

## 백엔드 모듈

| 모듈 | 주요 역할 |
|---|---|
| auth | Supabase JWT 검증, 사용자 동기화 |
| stores | 매장 CRUD, 테이블/카테고리 관리 |
| menus | 메뉴·옵션그룹 CRUD |
| orders | 주문 생성/조회/상태 변경 |
| sessions | 테이블 세션 관리 |
| payments | Toss Payments 승인·취소·환불 |
| calls | 직원 호출 (벨) |
| queue | pgmq 발행/소비, 재시도 로직 |
| notifications | FCM 디바이스 등록, 푸시 발송 |
| integrations/pos | Toss POS 주문 전송, 메뉴 동기화 |
| integrations/toss | Toss SDK 메뉴 동기화 |
| coupons | 쿠폰 발급/사용 |
| users | 사용자 주소, 즐겨찾기 |
| error-logs | 에러 기록 |

---

## 주요 API 라우트

```
POST   /stores/:storeId/orders/first          첫 주문 (세션 시작)
POST   /stores/:storeId/orders/:sessionId     추가 주문
POST   /orders                                배달/포장 주문
PATCH  /stores/:storeId/orders/:orderId/status         상태 변경
PATCH  /stores/:storeId/orders/:orderId/delivery-status 배달 상태 변경
PATCH  /orders/:orderId/cancel                         배달 주문 고객 취소
POST   /payments/orders/:orderId/toss/cancel           관리자 결제 취소/환불

GET    /stores/:storeId/tables/:tableNumber/current-session  현재 세션
POST   /stores/:storeId/tables/:tableNumber/reset            테이블 초기화

POST   /payments/toss/confirm   결제 승인
POST   /payments/toss/fail      결제 실패

GET    /stores/:storeId/categories
GET    /stores/:storeId/menus          (공개)
GET    /stores/:storeId/admin/menus    (인증 필요)

POST   /stores/:storeId/tables/:tableNumber/calls  직원 호출

POST   /stores/:storeId/integrations/toss/sync-menu     Toss 메뉴 동기화 (JWT 인증)
POST   /pos/catalogs/sync     POS 플러그인 메뉴 동기화 (API 키 인증)
POST   /queue/process-once    큐 수동 처리
```

---

## 주문 흐름

### 테이블 주문

```
1. 고객 QR 스캔 → table-order 앱 로드
2. 메뉴 선택 → 주문 완료 버튼

[첫 주문]
POST /stores/:storeId/orders/first
  → 세션 생성 + 주문 생성 (단일 트랜잭션)
  → 결제 완료 또는 POS 대상 흐름에 따라 pgmq 이벤트 큐잉

[추가 주문]
GET  /stores/:storeId/tables/:tableNumber/current-session  → sessionId 확인
POST /stores/:storeId/orders/:sessionId

3. QueueConsumerService → POS 전송 이벤트 처리
   성공: posSyncStatus = SENT
   실패: 최대 5회 재시도 (10s → 30s → 60s → 180s → 300s backoff)

4. Supabase Realtime → admin/table-order 앱 상태 갱신
```

### 배달 주문

```
1. delivery-customer 앱에서 메뉴 선택 + 주소 입력
2. Toss Payments 결제 위젯 실행
3. 결제 완료 → POST /payments/toss/confirm
4. pgmq order.paid 이벤트 → POS 전송 대상 분기, 알림 발송
```

---

## 주문 상태 전이 (State Machine)

```
PENDING ──────────────────────────────────────────────► CANCELLED
  │
  ├─[결제 필요]──► PENDING_PAYMENT ──► PAID ──────────► CANCELLED
  │                                     │
  └─[즉시 확인]────────────────────────►│
                                        ▼
                                    CONFIRMED ──────────► CANCELLED
                                        │
                              ┌─────────┴────────┐
                           COOKING           PREPARING ──► CANCELLED
                              │                   │
                              └────────┬──────────┘
                                       ▼
                                     READY ──────────────► CANCELLED
                                  ┌────┴────┐
                             DELIVERING  COMPLETED
                                  │
                              COMPLETED
```

COMPLETED, CANCELLED는 terminal 상태 (이후 전이 불가).
유효하지 않은 전이 시도 → `400 BadRequestException`.

---

## 메시지 큐 (pgmq)

Supabase PostgreSQL에 pgmq 확장으로 설치된 영속 MQ (Redis 불필요).

| 항목 | 값 |
|---|---|
| 큐 이름 | `backend_events` (환경변수 `BACKEND_QUEUE_NAME`) |
| 최대 재시도 | 5회 (`BACKEND_QUEUE_MAX_ATTEMPTS`) |
| Backoff | 10s → 30s → 60s → 180s → 300s |

**주요 이벤트 타입**

| 이벤트 | 발행처 | 처리 내용 |
|---|---|---|
| `order.paid` | payments | 주문 확정 + POS 전송 + FCM 알림 |
| `pos.send_order` | queue-consumer | Toss POS API 호출 |
| `notification.send` | queue-consumer | FCM 푸시 발송 |
| `delivery.status_changed` | orders | 배달 상태 알림 |
| `payment.reconcile` | payments | 결제 정산 |

---

## Realtime

admin과 table-order, Toss POS 플러그인이 Supabase Realtime WebSocket을 사용한다. 운영 데이터는 필요한 곳에 polling을 백업 경로로 둔다.

| 영역 | 채널 | 구독 테이블 | 이벤트/보완 |
|---|---|---|---|
| admin `useRealtimeOrders` | `orders:${storeId}` | `orders` | INSERT, UPDATE, DELETE |
| admin `useStaffCalls` | `staff-calls:${storeId}` | `StaffCall` | INSERT + 30초 polling |
| table-order `useOrdersByTable` | `orders:${storeId}:${tableNumber}` | `Order` | sessionId 확정 전 storeId 폴백, 확정 후 sessionId 필터 |
| toss-pos-plugin | `pos-orders` | `Order` | INSERT, UPDATE + 30초 polling + reconnect backoff |

---

## 인증

| Guard | 적용 대상 | 방식 |
|---|---|---|
| `SupabaseGuard` | admin·delivery-customer 엔드포인트 | `Authorization: Bearer <supabase_jwt>` |
| `PosIntegrationGuard` | `/pos/*` 엔드포인트 | API 키 헤더 |
| 내부 배치 secret | `/queue/process-once`, `/payments/toss/expire-pending`, `/payments/toss/reconcile` | `x-internal-job-secret` |
| 인증 없음 | 공개 매장/메뉴 조회, table-order 주문 생성/조회 일부 | - |

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|---|---|---|
| 프론트엔드 | Next.js | 16.1.1 |
| | React | 19.2.3 |
| | TypeScript | 5.x |
| | Tailwind CSS | 4.x |
| | Shadcn UI | latest |
| 상태 관리 | Zustand | 5.x |
| | TanStack Query | 5.x |
| 백엔드 | NestJS | 10.x |
| | Prisma | 5.22+ |
| | Express | 4.x |
| 데이터베이스 | Supabase PostgreSQL | - |
| | pgmq (MQ 확장) | - |
| 인증 | Supabase Auth + Passport JWT | - |
| Rate limit | NestJS Throttler + Redis store | - |
| 결제 | Toss Payments (`@tosspayments/payment-widget-sdk`) | 0.12.x |
| POS | Toss POS (okpos) REST API | - |
| 푸시 | Firebase Cloud Messaging | 12.x |
| 모니터링 | Sentry | 10.x |
| 배포 | Vercel Serverless | - |
| 모바일 | Capacitor | 6.x |
