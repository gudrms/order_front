# ⚙️ Backend - Table Order System

> NestJS 10 기반 태블릿 주문 시스템 API 서버

## 📋 개요

태블릿 주문 시스템의 Backend API 서버입니다. RESTful API와 Prisma ORM을 사용합니다.

---

## 🚀 기술 스택

- **Framework**: NestJS 10 (TypeScript)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5
- **Auth**: Passport JWT
- **Validation**: class-validator
- **Documentation**: Swagger (@nestjs/swagger)
- **Logger**: Winston
- **Security**: Helmet.js, Rate Limiting

---

## 📁 주요 구조

```
src/
├── modules/
│   ├── menus/          # 메뉴 관리
│   ├── orders/         # 주문 처리
│   ├── stores/         # 매장 관리
│   ├── auth/           # 인증
│   ├── integrations/   # Toss 오더 연동
│   ├── error-logs/     # 에러 로그
│   └── prisma/         # Prisma Service
├── common/
│   ├── filters/        # HttpExceptionFilter
│   ├── guards/         # ThrottlerGuard
│   ├── logger/         # Winston Logger
│   └── interceptors/   # Transform Interceptor
└── prisma/
    └── schema.prisma   # DB 스키마
```

---

## 🔧 실행

```bash
# 환경 변수 설정 (.env)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NODE_ENV=development

# Prisma 생성
pnpm prisma generate

# DB 마이그레이션
pnpm prisma db push

# 개발 서버
pnpm dev
# → http://localhost:4000

# Swagger 문서
#        .addServer('http://localhost:4000', 'Development Server') 문서
# → http://localhost:4000/api/docs

# 빌드
pnpm build
```

---

## 🗄️ Database (Prisma)

**모델**:
- Menu (메뉴)
- Category (카테고리)
- Order (주문)
- OrderItem (주문 항목)
- Table (테이블)
- Store (매장)
- User (사용자)
- ErrorLog (에러 로그)

**마이그레이션**:
```bash
# 스키마 변경 후
pnpm prisma generate
pnpm prisma db push

# Prisma Studio (DB GUI)
pnpm prisma studio
```

---

## 🔒 보안 기능

### 1. Rate Limiting (DDoS 방지)
```typescript
// app.module.ts
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 10 },   // 1초당 10개
  { name: 'medium', ttl: 60000, limit: 100 }, // 1분당 100개
  { name: 'long', ttl: 900000, limit: 1000 }, // 15분당 1000개
])
```

### 2. Helmet.js (보안 헤더)
```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
```

### 3. CORS 정책
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'https://order-front-frontend.vercel.app',
  credentials: true,
});
```

### 4. Input Validation
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

### 5. 에러 처리
```typescript
// HttpExceptionFilter
- 스택 트레이스 숨김 (프로덕션)
- 일관된 에러 응답 포맷
- Winston Logger 연동
```

---

## 📡 주요 API

### Menus
- `GET /api/v1/stores/:storeType/:branchId/menus` - 메뉴 목록 조회
- `GET /api/v1/stores/:storeType/:branchId/menus/:id` - 메뉴 상세 조회

### Orders
- `POST /api/v1/stores/:storeType/:branchId/orders` - 주문 생성
- `GET /api/v1/stores/:storeType/:branchId/orders/:orderId` - 주문 조회

### Stores
- `GET /api/v1/stores/:storeType/:branchId` - 매장 정보 조회

---

## 📝 Winston Logger

```typescript
// Logging 예시
import { LoggerService } from '@/common/logger';

constructor(private logger: LoggerService) {}

// Info 로그 (Console만)
this.logger.log('주문 생성 성공', 'OrdersService');

// Error 로그 (Console + Supabase DB)
this.logger.error('주문 생성 실패', error.stack, 'OrdersService');

// Critical 로그 (Console + Supabase DB)
this.logger.critical('Toss 오더 연동 심각 오류', {
  orderId: order.id,
  storeId: order.storeId,
});
```

**저장 규칙**:
- `info`, `warn`: Console만
- `error`, `critical`: Console + Supabase `error_logs` 테이블

---

## 🔗 Toss Integration

### 1. POS Order Integration (Plugin)
**Architecture**: Hybrid (Realtime + Polling)
- **POS Plugin** (`apps/toss-pos-plugin`) runs on the POS device.
- Plugin receives orders via **Supabase Realtime** (primary) or polls `GET /api/v1/pos/orders/pending` (fallback).
- Plugin registers orders to POS and updates status via `PATCH /api/v1/pos/orders/:id/status`.

**API Endpoints**:
- `GET /api/v1/pos/orders/pending`: Fetch pending orders.
- `PATCH /api/v1/pos/orders/:id/status`: Update order status.

### 2. Menu Synchronization (Open API)
**Architecture**: Server-to-Server
- Backend fetches menu data from **Toss Open API**.
- Syncs Categories, Products, and Options to the database.

**API Endpoints**:
- `POST /api/v1/stores/:storeId/integrations/toss/sync-menu`: Trigger menu sync.
- `POST /api/v1/stores/:storeId/integrations/toss/test-connection`: Test API connection.

---

## 🛡️ 외부 API 장애 대응 - 3중 방어 구조

POS 등 외부 API 통신 장애 시 서비스 전체가 멈추지 않도록 3단계 방어 구조를 적용했습니다.

### 전체 흐름

```
주문 결제 완료
  └─▶ [Queue] pos.send_order 이벤트 적재 (pgmq)
        └─▶ [1단계] Circuit Breaker 가용성 확인 (opossum)
              ├─ CLOSED(정상) ─▶ posSyncStatus = PENDING
              │                    └─▶ Toss POS 플러그인이 폴링 후 SDK 전송
              │                          ├─ 성공 ─▶ posSyncStatus = SENT
              │                          └─ 실패 ─▶ PATCH /pos/orders/:id/sync-failed
              │                                        └─▶ [2단계] Backoff retry
              └─ OPEN(장애) ─▶ throw ─▶ [2단계] Backoff retry
                                           └─▶ [10s → 30s → 60s → 180s → 300s, 최대 5회]
                                                 └─▶ 5회 초과 ─▶ posSyncStatus = FAILED + archive
```

---

### 1단계 - Circuit Breaker (`ResilientPosService`)

**파일**: `src/modules/integrations/pos/pos.resilience.ts`

외부 POS API 호출을 Circuit Breaker로 감쌉니다. 실패율이 임계치를 초과하면 즉시 Fail-fast 처리해 서버 스레드 고갈을 방지합니다.

```typescript
// 설정값
{
  timeout: 3000,                  // 3초 응답 없으면 실패 처리
  errorThresholdPercentage: 50,   // 실패율 50% 초과 시 OPEN 전환
  resetTimeout: 10000,            // 10초 후 Half-Open 전환 (재시도 허용)
}
```

**상태 전이**:

| 상태 | 동작 |
|------|------|
| `CLOSED` | 정상. 모든 요청 통과 |
| `OPEN` | 차단. 즉시 `false` 반환 → queue retry로 위임 |
| `HALF-OPEN` | 탐색. 1회 시도 후 성공이면 CLOSED, 실패면 다시 OPEN |

**Queue 연동** (`QueueConsumerService.handlePosSendOrder`):

```typescript
// Circuit Breaker가 OPEN이면 예외를 던져 backoff retry로 위임
const available = await this.resilientPosService.sendOrder({ orderNumber });
if (!available) {
  throw new Error('POS unavailable (Circuit Breaker OPEN) — queued for retry');
}
// CB 통과 시 PENDING으로 전환 → 플러그인이 폴링 후 실제 전송
```

---

### 2단계 - 비동기 재시도 (pgmq + Exponential Backoff)

**파일**: `src/modules/queue/queue-consumer.service.ts`, `src/modules/queue/queue.service.ts`

실패한 이벤트를 버리지 않고 메시지 큐(pgmq)에 지연 재적재합니다. pgmq는 Supabase의 PostgreSQL 확장으로, 별도 인프라 없이 DB 트랜잭션과 함께 메시지를 처리합니다.

**Backoff 정책**:

| 시도 | 대기 시간 |
|------|-----------|
| 1회 | 10초 후 재시도 |
| 2회 | 30초 후 재시도 |
| 3회 | 60초 후 재시도 |
| 4회 | 180초 후 재시도 |
| 5회 | 300초 후 재시도 |
| 초과 | FAILED + archive |

**Supabase pgmq 활성화**: `supabase/migrations/202605010001_enable_pgmq_backend_events.sql`

```sql
create extension if not exists pgmq;
select pgmq.create('backend_events');
```

**플러그인 실패 보고 루프**:

Toss POS 플러그인이 SDK 전송에 실패하면 즉시 백엔드에 보고해 attempt count를 올립니다.

```typescript
// apps/toss-pos-plugin/src/order.ts
} catch (error) {
  await markOrderSyncFailed(order.id, error.message);
  // → PATCH /pos/orders/:id/sync-failed
  // → posSyncAttemptCount++, backoff retry 트리거
}
```

---

### 3단계 - 수동 복구 API

**파일**: `src/modules/queue/queue-operations.controller.ts`

5회 재시도 초과 후 `FAILED` 상태가 된 주문을 관리자가 수동으로 복구할 수 있는 API를 제공합니다.

```
GET  /stores/:storeId/operations/notifications/failed   # 실패 목록 조회
PATCH /stores/:storeId/operations/notifications/:id/retry  # 수동 재시도
```

수동 재시도 시 상태를 `PENDING`으로 되돌리고 큐에 재적재합니다.

---

### 관련 DB 필드 (`Order` 테이블)

| 필드 | 설명 |
|------|------|
| `posSyncStatus` | `PENDING` / `SENT` / `FAILED` / `SKIPPED` |
| `posSyncAttemptCount` | 총 시도 횟수 |
| `posSyncLastError` | 마지막 실패 사유 |
| `posSyncUpdatedAt` | 마지막 상태 변경 시각 |

---

## 📦 배포

**Vercel**: https://order-front-backend.vercel.app

**환경 변수** (Vercel Dashboard):
```
NODE_ENV=production
FRONTEND_URL=https://order-front-frontend.vercel.app
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

**Swagger**: https://order-front-backend.vercel.app/api/docs

---

## 🧪 테스트

```bash
# 백엔드 테스트
pnpm test

# 특정 테스트
pnpm test --filter=orders
```

---

## 🐛 문제 해결

### Prisma 연결 에러
```bash
# 환경 변수 확인
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require"

# Prisma 재생성
pnpm prisma generate
```

### CORS 에러
```bash
# .env 확인
FRONTEND_URL=https://order-front-frontend.vercel.app

# main.ts CORS 설정 확인
```

### Rate Limiting 조정
```bash
# apps/backend/src/app.module.ts
# limit 값 증가 (개발 환경)
```

---

## 📚 참고

- [NestJS 문서](https://docs.nestjs.com/)
- [Prisma 문서](https://www.prisma.io/docs)
- [Root README](../../README.md)
- [백엔드 체크리스트](./BACKEND_CHECKLIST.md)
- [백엔드 기술 스펙](./BACKEND_TECH_SPEC.md)
- [MQ 기술 스펙](./MQ_TECH_SPEC.md)

---

## 📧 문의

Backend 관련 문의사항이 있으시면 이슈를 생성해주세요.
