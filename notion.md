# DineOS (식당 운영 통합 시스템)

식당 체인을 위한 옴니채널 주문 통합 플랫폼 - 매장 주문, 배달 주문, 관리자 대시보드, 브랜드 홈페이지를 하나의 모노레포에서 운영하는 All-in-One 시스템

---

## 프로젝트 정보

| 항목 | 내용 |
| --- | --- |
| 기간 | 2025.10 ~ 진행 중 |
| 팀 구성 | 1인 개인 프로젝트 |
| 역할 | 풀스택 개발자 |
| 형태 | 모노레포 (pnpm Workspace + Turborepo) |

---

## 기술 스택

### Frontend

| 분류 | 기술 |
| --- | --- |
| Framework | Next.js 16.1.1 (App Router), React 19.2, TypeScript 5 |
| Styling | Tailwind CSS 4, Shadcn UI 스타일 기반 공통 UI 패키지 |
| State | Zustand 5 (클라이언트 상태), TanStack Query 5 (서버 상태) |
| PWA / App | Next-PWA, Capacitor 6 (iOS/Android WebView 앱) |
| Test | Vitest, Testing Library, Playwright |

### Backend

| 분류 | 기술 |
| --- | --- |
| Framework | NestJS 10, TypeScript 5 |
| ORM | Prisma 5 |
| DB | PostgreSQL (Supabase, 로컬 설정 기준 PostgreSQL 17) |
| Queue | pgmq (PostgreSQL 기반 메시지 큐) |
| Cache / Rate Limit | Redis (ioredis) - Vercel 다중 인스턴스 Rate Limiting 공유 저장소 |
| Security | Helmet.js, CSP, Rate Limiting, CORS, Supabase JWT Guard, POS API Key Guard |
| Logger / Monitoring | Winston, Sentry, Vercel Logs, Supabase error log transport |
| API Docs | Swagger / OpenAPI |

### DevOps

| 분류 | 기술 |
| --- | --- |
| Monorepo | pnpm Workspace + Turborepo |
| Deployment | Vercel (Frontend + Backend Serverless), Supabase |
| CI/CD | GitHub Actions |
| Monitoring | Sentry, Vercel Logs, GitHub Actions |

---

## 시스템 구조

핵심 서비스는 4개의 프론트엔드 앱, 1개의 백엔드, 4개의 공유 패키지로 구성했다. 추가로 Toss POS 플러그인과 Admin Electron 확장 앱도 같은 워크스페이스에서 관리한다.

```txt
apps/
├── table-order        # 매장 태블릿/QR 주문
├── delivery-customer  # 배달 주문 (Web/PWA + Capacitor iOS/Android)
├── admin              # 주방 화면 + 관리자 대시보드
├── brand-website      # 브랜드 홈페이지
├── backend            # NestJS 통합 API (Vercel Serverless)
├── toss-pos-plugin    # Toss POS 플러그인 연동 앱
└── admin-electron     # 관리자 데스크톱 확장 앱

packages/
├── @order/shared      # 공통 타입, 유틸, 상수, API 클라이언트
├── @order/ui          # 공통 UI 컴포넌트
├── @order/order-core  # 주문 비즈니스 로직 (프론트)
└── @order/config      # ESLint, TSConfig 공통 설정
```

---

## 주요 앱

### 1. Table Order (매장 태블릿/QR 주문)

고객이 매장 내 태블릿 또는 본인 스마트폰으로 QR을 스캔해 주문하는 공개 주문 시스템이다. 별도 로그인 없이 `storeId`와 `tableNumber` 기반으로 주문 흐름을 진행한다.

**주요 기능**

- 카테고리별 메뉴 브라우징 및 옵션 선택
- 실시간 장바구니 (수량 조절, 삭제)
- QR 진입 후 테이블 번호 자동 설정 및 3초 확인 카운트다운
- 직원 호출 버튼 및 관리자 화면 실시간 알림 연동
- 주문 완료 후 자동 메뉴 화면 복귀

**기술 포인트**

- Container/Presenter 패턴으로 UI와 비즈니스 로직 분리
- Zustand 기반 장바구니/테이블 상태 관리
- TanStack Query 기반 메뉴/주문 서버 상태 캐싱
- 현재 주문 상태 확인은 polling 기반으로 처리하며, Supabase Realtime 전환 여지를 남김
- PWA 구성 및 Sentry 에러 모니터링

**배포:** Vercel / 개발 포트 3000

### 2. Delivery Customer (배달 주문)

웹/PWA와 Capacitor 기반 Android/iOS 앱 빌드를 지원하는 배달 주문 앱이다. Supabase Auth 기반 고객 인증 후 Toss Payments 결제 흐름을 제공한다.

**주요 기능**

- PWA 홈 화면 추가 및 Capacitor 기반 네이티브 앱 빌드
- Toss Payments 결제
- 배달 주문 생성, 결제 승인/실패 처리
- 주문/배달 상태 추적
- 푸시 알림 및 포어그라운드 로컬 알림
- 주소 입력과 배달 가능 여부 확인
- Toss POS 연동이 없어도 Toss Payments 결제 모듈을 통한 배달 결제 가능

**Native 플러그인**

Camera, Geolocation, Push Notifications, Local Notifications, Status Bar, Haptics, Share, Browser, Toast, Network, App

**기술 포인트**

- Next.js 웹/PWA를 Capacitor WebView로 감싸 모바일 앱 대응
- `CAPACITOR_SERVER_URL` 기반 로컬/운영 WebView 분기
- 로컬 개발 HTTP 환경에서만 cleartext/allowMixedContent 허용
- Android는 Windows 환경에서 빌드 가능, iOS는 macOS/Xcode 필요

**배포:** Vercel (웹) / Capacitor 앱 빌드 / 개발 포트 3001

### 3. Admin Dashboard (관리자)

주방 화면과 관리자 대시보드를 하나의 앱으로 제공한다.

**주요 기능**

- 실시간 주문 알림 (Supabase Realtime) + 소리/Toast 알림
- 매장 생성/수정 및 매장 선택
- 주문 상태 관리 (접수 -> 조리 중 -> 완료)
- 배달 상태 관리
- 직원 호출 알림 수신
- 일별 주문/매출 요약 카드
- QR 테이블 관리
- 메뉴 관리 (등록, 수정, 품절 처리)
- POS 동기화 실패 주문 수동 재시도 UI
- Toss Payments 전액/부분 환불 처리 UI

**기술 포인트**

- Supabase Realtime `postgres_changes` 구독으로 주문/직원 호출 이벤트 반영
- TanStack Query invalidate를 통한 관리자 데이터 동기화
- 30초 polling을 일부 운영 데이터의 백업 갱신 경로로 사용
- Supabase JWT 기반 관리자 API 접근 제어

**배포:** Vercel / 개발 포트 3003

### 4. Brand Website (브랜드 홈페이지)

브랜드 소개, 메뉴, 매장, 창업 문의를 제공하는 브랜드 홈페이지다.

**주요 기능**

- 브랜드 스토리, 대표 메뉴, 매장 위치, 창업 문의
- 창업 문의 API 연동
- 개인정보 처리방침 페이지

**기술 포인트**

- Next.js App Router 기반 페이지 구성
- Meta 태그, Open Graph, Sitemap, Robots 기반 SEO 구성
- Sentry 기반 프론트엔드 에러 모니터링

**배포:** Vercel / 개발 포트 3002

### 5. Backend API (NestJS)

모든 프론트 앱과 POS 플러그인이 사용하는 NestJS 통합 REST API 서버다.

**주요 모듈**

- MenusModule: 메뉴 CRUD, 카테고리, 옵션, 품절 처리
- OrdersModule: 주문 생성, 조회, 상태 변경, 통계, POS 재시도
- StoresModule: 다중 매장 지원 (`menuManagementMode: TOSS_POS / ADMIN_DIRECT`)
- PaymentsModule: Toss Payments 승인, 실패 기록, 만료 처리, 정합성 복구, 환불
- IntegrationsModule: Toss POS/POS 플러그인 연동
- QueueModule: pgmq 기반 이벤트 큐 발행/소비/재시도
- NotificationModule: 인앱 알림 및 FCM 푸시 알림
- ErrorLogsModule: 에러 로그 저장 및 조회
- FranchiseInquiriesModule: 창업 문의 접수 및 관리자 조회

**주요 API 엔드포인트**

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/v1/stores/:storeId/menus` | 메뉴 목록 |
| POST | `/api/v1/stores/:storeId/orders/first` | 테이블 첫 주문 생성 |
| POST | `/api/v1/orders` | 배달/포장 주문 생성 |
| PATCH | `/api/v1/stores/:storeId/orders/:id/status` | 주문 상태 변경 |
| PATCH | `/api/v1/stores/:storeId/orders/:id/delivery-status` | 배달 상태 변경 |
| PATCH | `/api/v1/stores/:storeId/orders/:id/pos-sync/retry` | POS 재전송 |
| GET | `/api/v1/stores/:storeId` | 매장 정보 |
| POST | `/api/v1/payments/toss/confirm` | Toss Payments 결제 승인 |
| POST | `/api/v1/payments/orders/:orderId/toss/cancel` | Toss Payments 환불/취소 |
| POST | `/api/v1/queue/process-once` | 큐 1회 처리 (내부 잡) |

**배포:** Vercel Serverless (Node.js 20) / 개발 포트 4000

---

## 기술적 도전 & 해결

### 1. POS 장애 격리 & Circuit Breaker

POS 연동 장애가 전체 주문 실패로 전파되지 않도록 Circuit Breaker, Queue retry, 관리자 수동 재시도 구조를 구성했다.

**Circuit Breaker 설정 (opossum v9.0.0)**

| 옵션 | 값 | 설명 |
| --- | --- | --- |
| timeout | 3,000ms | 개별 요청 최대 대기 시간 |
| errorThresholdPercentage | 50% | 실패율 초과 시 OPEN 전환 |
| resetTimeout | 10,000ms | OPEN -> HALF-OPEN 대기 시간 |
| rollingCountTimeout | 10,000ms (기본값) | 실패율 집계 슬라이딩 윈도우 |
| volumeThreshold | 0 (기본값) | 최소 요청 수 제한 없음 |

**상태 전이**

| 상태 | 전환 조건 | 동작 |
| --- | --- | --- |
| CLOSED | 기본 상태 | POS API 실제 호출 |
| OPEN | 최근 실패율 50% 초과 | 즉시 fallback, POS 호출 차단 |
| HALF-OPEN | OPEN 후 10초 경과 | 요청 1건 시도 후 성공 시 CLOSED 복귀 |

**Queue Exponential Backoff 재시도**

| 시도 횟수 | 대기 시간 |
| --- | --- |
| 1차 실패 | 10초 후 재시도 |
| 2차 실패 | 30초 후 재시도 |
| 3차 실패 | 60초 후 재시도 |
| 4차 실패 | 3분 후 재시도 |
| 5차 실패 | 5분 후 재시도 |
| 5회 초과 | 현재 메시지 archive 및 실패 상태 기록 |

**전체 흐름**

```txt
[프론트] 주문 생성
  -> OrdersService / DeliveryOrderService: DB 저장
  -> QueueService: order.paid 이벤트 발행

[QueueConsumer] handleOrderPaid()
  -> TOSS_POS 매장이면 pos.send_order 발행
  -> ADMIN_DIRECT 매장이면 POS 전송 skip

[QueueConsumer] handlePosSendOrder()
  -> ResilientPosService.sendOrder() <- Circuit Breaker
    -> 성공: posSyncStatus = SENT
    -> 실패: posSyncStatus = FAILED 또는 PENDING 유지 후 backoff retry

[Admin]
  -> POS 실패 주문 조회
  -> pos-sync/retry API로 수동 재시도
```

**멱등성 보장**

- 이벤트마다 `idempotencyKey` 부여
- `QueueEventLog`에서 `SUCCEEDED` 상태를 확인해 중복 메시지 재처리 차단
- Toss Payments 승인/취소 요청에도 idempotency key 적용

### 2. 실시간 주문 처리 안정화

관리자 화면은 Supabase Realtime으로 주문/직원 호출 이벤트를 반영하고, 고객/플러그인 흐름에는 polling 또는 Realtime+polling을 목적에 맞게 조합했다.

**Realtime + Polling 구조**

| 영역 | 방식 | 역할 |
| --- | --- | --- |
| Admin 주문 화면 | Supabase Realtime `postgres_changes` | 주문 생성/변경 감지 후 쿼리 무효화 |
| Admin 직원 호출 | Supabase Realtime + 30초 polling | 호출 이벤트 수신 및 백업 갱신 |
| Table Order | 5초 polling 중심 | 주문 상태/내역 확인 |
| Delivery Customer | API 조회 + 상태 갱신 흐름 | 고객 주문/배달 상태 확인 |
| Toss POS Plugin | Supabase Realtime + 30초 polling + reconnect backoff | POS 주문 등록 누락 방지 |

**이벤트 큐 구조 (pgmq)**

| 이벤트 | 설명 |
| --- | --- |
| `order.paid` | 결제 완료 -> POS 전송 + 알림 트리거 |
| `pos.send_order` | POS 주문 전송 |
| `notification.send` | 인앱/푸시 알림 발송 |
| `payment.reconcile` | Toss Payments 결제 상태 정합성 확인 |
| `delivery.status_changed` | 배달 상태 변경 -> 고객/매장 알림 |

### 3. 운영 안정성 & 보안 강화

서버리스 환경에서 API 남용, 비정상 반복 요청, 잘못된 입력, 외부 도메인 접근을 제어하기 위한 백엔드 공통 보안 계층을 구성했다.

**적용 항목**

| 항목 | 적용 내용 | 목적 |
| --- | --- | --- |
| Rate Limiting | Vercel `x-forwarded-for` 기반 클라이언트 IP 추적, 1초 10회 / 1분 100회 / 15분 1000회 제한 | API 남용 및 반복 요청 완화 |
| Redis Store | REDIS_URL 설정 시 Throttler 카운터를 Redis에 저장 | Vercel 다중 인스턴스 간 제한 카운터 공유 |
| Helmet.js / CSP | 보안 헤더 및 Content Security Policy 적용 | XSS, Clickjacking 등 브라우저 기반 공격 완화 |
| CORS | 운영 도메인 allowlist 적용, credentials 제어 | 허용된 프론트엔드만 API 접근 |
| Input Validation | ValidationPipe whitelist, forbidNonWhitelisted 적용 | DTO 외 필드 차단 및 입력 검증 |
| Auth | Supabase JWT Guard와 POS API Key Guard 적용 | 관리자/사용자 API 및 POS 연동 API 접근 제어 |
| Error Handling | HttpExceptionFilter, Sentry 민감 헤더 제거 | 일관된 에러 응답 및 민감정보 노출 방지 |

**주의점**

- Rate Limiting은 DDoS를 완전히 방어하는 장치라기보다 API 남용과 트래픽 폭주를 완화하는 애플리케이션 레벨 방어다.
- 대규모 DDoS 대응은 Vercel Firewall, CDN/WAF 같은 Edge 계층과 함께 구성하는 것이 적절하다.

### 4. Serverless Queue 처리 최적화

큐 처리 API는 일반 HTTP 앱과 분리해 cold start 부담을 줄였다.

**구성**

- 일반 API: `api/index.ts` -> 전체 `AppModule`
- 큐 처리 API: `api/queue.ts` -> `QueueAppModule`
- QueueAppModule은 ConfigModule, QueueModule, NotificationsModule만 로드
- Auth, Menus, Orders, Stores, Sessions, Payments, Coupons 등 HTTP 중심 모듈은 제외

**효과**

- 큐 처리 함수의 초기화 모듈 수 감소
- GitHub Actions cron에서 5분마다 큐 처리, 결제 만료, 결제 정합성 확인 수행
- Vercel Serverless 환경에서 백그라운드 작업을 별도 entrypoint로 분리

### 5. DevOps & 비용 절감

기존 고정 서버 운영 대신 Vercel Serverless와 Supabase를 조합해 초기 운영 비용을 최소화했다.

**비용 비교**

| 구분 | 구성 | 월 비용 |
| --- | --- | --- |
| 기존안 | NCP Server 2vCPU 4GB + Cloud DB | 약 95,000원 |
| 현재안 | Vercel + Supabase 무료 Tier | 0원 |

**CI/CD**

- GitHub Actions: 백엔드 타입체크, Vitest, 프론트 타입체크, Playwright E2E
- Git push / PR 기준 자동 검증
- Turborepo 기반 모노레포 빌드 오케스트레이션
- Vercel 프로젝트별 배포 구성

---

## 성과

### 기술적 성과

1. **모노레포 구조 확립** - 4개 핵심 프론트 앱과 백엔드, 공유 패키지를 단일 코드베이스로 관리
2. **3중 장애 격리** - Circuit Breaker + Queue Backoff + 관리자 수동 재시도로 POS 장애 대응
3. **멱등성 보장** - `idempotencyKey` + `QueueEventLog`로 중복 이벤트 처리 차단
4. **운영 보안 기반 구성** - Redis-backed Rate Limiting, Helmet/CSP, CORS allowlist, DTO Validation, Supabase JWT Guard, POS API Key Guard 적용
5. **Serverless 작업 분리** - 일반 API와 큐 처리 전용 entrypoint를 분리해 cold start 부담 감소
6. **DevOps 자동화** - GitHub Actions 기반 타입체크/테스트/E2E 검증
7. **비용 절감** - 월 95,000원 수준의 고정 서버 비용을 초기 운영 기준 0원으로 절감
8. **테스트 검증** - 백엔드 Vitest 21개 파일 / 150개 테스트 통과, Playwright E2E 구성

### 비즈니스 성과

1. **도입 준비 중** - 가족 식당 체인 약 7개 매장 적용을 목표로 설계
2. **옴니채널 지원** - 태블릿 주문, QR 주문, 배달 웹/앱, 관리자 화면, 브랜드 홈페이지 통합
3. **확장 용이성** - 다중 매장 구조와 공유 패키지 기반으로 매장 추가 및 기능 확장 비용 감소
4. **운영 비용 절감 기대** - 기존 태블릿 주문 솔루션 대체 시 매장당 월 고정 비용 절감 가능

---

## 향후 계획

- **Admin Dashboard 고도화** - 매출 차트, 메뉴 추천, 재고 관리 기능 확장
- **iOS 앱 출시** - App Store 제출 및 iOS 네이티브 빌드 환경 구성
- **추가 매장 확장** - 7개 매장 적용 후 15개 이상 확장 가능한 프랜차이즈 구조 고도화
- **Edge/WAF 계층 보안 강화** - Vercel Firewall 또는 CDN/WAF 기반 대규모 트래픽 방어 계층 추가
- **알림 연동 확장** - Critical 에러 Slack 알림 및 운영 알림 채널 추가
- **Vercel Analytics 또는 Product Analytics 도입** - 사용자 행동/성능 지표 수집 체계 보강
