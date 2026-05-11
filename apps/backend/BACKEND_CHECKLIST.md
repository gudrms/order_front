# 백엔드 체크리스트
마지막 업데이트: 2026-05-07 (루트 체크리스트 기준 동기화)

## 🚨 1차 런칭 Blocker

- [x] **[P0] MQ consumer 자동 트리거 부재** (2026-05-04): Vercel Pro 업그레이드 대신 **GitHub Actions**(`.github/workflows/backend-cron.yml`) schedule을 사용하여 `POST /queue/process-once` 등의 엔드포인트를 주기적으로 호출하도록 구축 완료.
- [x] **[P0] CORS 다중 origin 화이트리스트** (2026-05-04): `main.ts` 운영 기본값에 tacomole.kr 5개 도메인 + Capacitor scheme 자동 허용. `FRONTEND_URLS` 콤마 구분 환경변수로 추가 origin override 가능
- [x] **[P0] `.env.example` 정리** (2026-05-04): 중복 복붙 제거 + `INTERNAL_JOB_SECRET`, `FRONTEND_URLS` 추가, 섹션별 주석 보강

## ⚠️ High risk

- [ ] 실 Toss 카드결제 자동화 E2E — `payments-e2e.spec.ts`는 서비스 레이어 mock 한정. 실 HTTP 콜백/idempotency/취소 무점검
- [x] Throttler in-memory store Vercel 다중 인스턴스에서 무력화 → Redis store 도입 완료 (2026-05-05): `@nest-lab/throttler-storage-redis` + Upstash Redis 적용. REDIS_URL 있으면 Redis, 없으면 in-memory 폴백.
- [ ] 단일 serverless function 라우팅 (`vercel.json` 모든 메서드 → `src/main.ts`) — cold start/번들 크기 모니터링, queue function 분리 검토 (이미 [ ]로 있음)

## 🧱 Tech debt

- [x] `apps/backend/src/modules/orders/orders.controller.ts:11-22` 인라인 OrderStatus enum 제거 (2026-05-05): `@prisma/client`의 `OrderStatus` enum 직접 import로 교체. tsc 통과.
- [ ] BACKEND_CHECKLIST 131-133라인 HOMEPAGE 항목은 정책 폐기됨 (아래 정책 변경 섹션 참조)
- [ ] `error-logs`, `sessions`, `integrations/toss`, `menu-detail`, `app.module` 테스트 미작성

## 현재 백엔드 범위

- [x] NestJS 백엔드가 매장, 메뉴, 주문, 결제, 세션, 인증, Toss 연동 공통 REST API를 담당한다.
- [x] 기본 데이터베이스는 Supabase PostgreSQL이다.
- [x] 애플리케이션 ORM은 Prisma를 사용한다.
- [x] 프론트/POS 화면 갱신과 주문 관찰은 Supabase Realtime을 사용한다.
- [x] 백엔드 전용 구현 체크리스트를 이 문서로 분리하고 루트 체크리스트에서 연결한다.
- [x] 백엔드 기술 스펙은 [BACKEND_TECH_SPEC.md](./BACKEND_TECH_SPEC.md)로 분리한다.
- [x] MQ 기술 스펙은 [MQ_TECH_SPEC.md](./MQ_TECH_SPEC.md)로 분리한다.

## MQ 도입 방향

- [x] MQ는 프론트 구독용이 아니라 백엔드 비동기 처리 계층으로 도입한다.
- [x] 배달앱, 관리자, 테이블오더, 홈페이지, POS 플러그인은 계속 REST API를 명령 경계로 사용한다.
- [x] 프론트 화면 갱신과 POS 관찰에는 필요한 경우 Supabase Realtime을 사용한다.
- [x] 반드시 재시도하거나 복구해야 하는 서버 작업에 MQ를 사용한다.

## 권장 기술

- [x] 1순위 기술은 Supabase Queues / `pgmq`로 정한다.
- [x] MVP 단계에서는 기존 Supabase PostgreSQL을 활용해 Kafka/RabbitMQ/Redis 인프라 추가를 피한다.
- [x] 현재 시스템이 Supabase에 의존하므로 주문/결제/POS/알림 작업에는 `pgmq`를 우선 검토한다.
- [ ] consumer를 Vercel 네이티브 queue function으로 분리할 때 Vercel Queues를 재검토한다.
- [x] 이벤트량, 장기 replay, 다중 서비스 분석 파이프라인이 필요해지기 전까지 Kafka는 도입하지 않는다.

## MQ 1차 적용 후보

- [x] `payment.paid`: Toss 승인과 로컬 DB 상태 저장이 모두 성공한 뒤에만 발행한다.
- [x] `payment.refunded`: 환불/취소 상태가 DB에 반영된 뒤 발행한다.
- [x] `order.paid`: 결제 완료 이후 POS 전송과 매장 알림 작업을 후처리 이벤트로 분리한다.
- [x] `pos.send_order`: POS 전송 시도를 주문/결제 응답 경로에서 분리한다.
- [x] `notification.send`: 비즈니스 최종 이벤트에서만 알림 작업을 만들고 dedupe key로 중복을 막는다.
- [x] `payment.expire_pending`: pending 결제 만료 처리는 내부 secret 보호 endpoint를 scheduled worker에서 호출하는 방향으로 정한다.
- [x] `delivery.status_changed`: 배달 상태 변경 후 알림과 downstream tracking에 사용한다.

## REST/동기 처리로 유지할 것

- [x] 메뉴/매장 조회.
- [x] 배달 주문 초안 생성과 금액 검증.
- [x] Toss 결제 승인 요청 처리.
- [x] 관리자/매장 소유자가 요청한 주문 상태 변경.
- [x] 결제 승인 전 고객 주문 취소.
- [x] 관리자 환불/취소 API의 권한 검증과 비즈니스 검증.

## 안전 규칙

- [x] `Order.status` / `Payment.status`가 DB에 확정되기 전에는 고객에게 "주문 접수/확정" 알림을 보내지 않는다.
- [x] 카드사/Toss 앱의 결제 승인 알림은 외부 알림이라 막을 수 없으므로, 로컬 확정 실패 시 빠르게 보상 처리한다.
- [x] Toss 승인 성공 후 로컬 DB 저장이 실패하면 MQ에만 맡기지 말고 같은 요청 경로에서 즉시 결제 취소/환불을 시도한다.
- [x] consumer는 `eventType + orderId + paymentId` 같은 키로 idempotent하게 만든다.
- [x] `posSyncStatus`, 재시도 횟수, 마지막 오류처럼 처리 상태는 비즈니스 상태와 분리해 저장한다.
- [x] 큐 인증 정보나 consumer 처리 로직은 프론트 앱에 노출하지 않는다.

## 구현 체크리스트

- [x] MQ 기술 스펙을 작성하고 백엔드 문서에서 연결한다.
- [x] Supabase migration으로 `pgmq` extension을 활성화한다.
- [x] `order_events`, `payment_events`, `pos_jobs`, `notification_jobs` 큐를 만들거나, 1차로 typed `backend_events` 큐 하나에서 시작한다.
- [x] producer/consumer interface를 가진 백엔드 `QueueModule`을 추가한다.
- [x] 주문, 결제, POS, 알림, 배달 이벤트 payload 타입을 정의한다.
- [x] 결제/주문 흐름의 DB commit 이후 producer 호출을 추가한다.
- [x] POS 전송 worker 처리를 추가한다.
- [x] 알림 작업 worker를 추가하고 dedupe/운영 로그를 기록한다.
- [x] retry/backoff 정책과 최대 시도 횟수 정책을 추가한다.
- [x] 실패 이벤트 로깅 또는 archive 처리를 추가한다.
- [x] Vercel Cron 또는 운영 배치에서 호출할 수 있는 내부 큐 처리 endpoint를 추가한다.
- [x] POS 전송 실패 상태와 시도 횟수 기록 필드를 추가한다.
- [x] 관리자에서 확인 가능한 POS/알림 실패 상태 또는 운영 로그를 추가한다.
- [x] 운영상 필요하면 POS 전송 실패 수동 재시도 endpoint/button을 추가한다.
- [x] Toss와 로컬 결제 상태 불일치 복구 reconciliation job을 추가한다.
- [x] idempotency, 중복 메시지, retry exhaustion, 성공 처리 테스트를 추가한다.
- [x] POS 전송 worker가 실제 `ResilientPosService.sendOrder()`를 호출하고 성공/실패 상태를 기록한다.
- [x] 큐 발행 실패를 `QueueEventLog`에 남겨 후속 운영 복구가 가능하게 한다.
- [x] `expire-pending`, `reconcile`, `queue/process-once` 운영 endpoint를 내부 secret으로 보호한다.
- [x] 실제 운영 DB에 최신 queue/POS migration을 적용한다.
- [x] 알림 provider(Push/SMS/Email 등)를 연결해 `notification.send`가 실제 발송까지 수행하게 한다.
- [x] Toss 승인 성공 후 로컬 DB 저장 실패 시 즉시 보상 취소/환불을 수행한다.
- [x] `delivery.status_changed` 이벤트 발행/consumer 처리를 추가한다.
- [x] CORS `allowedHeaders`에 POS/Idempotency/Internal-Secret 헤더를 추가한다.
- [x] `fetchMenuData` Mock 데이터에 프로덕션 환경 guard를 추가한다.
- [x] `mapTossMethod` 중복 코드를 `common/utils/toss.utils.ts`로 추출한다.
- [x] `QueueModule`을 `AppModule`에 등록하여 MQ 전체가 프로덕션에서 동작하도록 보장한다.
- [x] Toss 카드결제 E2E 통합 테스트: 성공/실패/보상취소/전액환불/부분환불/타임아웃 6개 시나리오 (payments-e2e.spec.ts)

## 1차 PR 범위

- [x] 큐 설계와 migration만 추가한다.
- [x] 기존 동작을 바꾸지 않는 `QueueModule` producer를 추가한다.
- [x] 결제 DB commit 이후 `order.paid`를 발행한다.
- [x] 처리 로그만 기록하는 최소 consumer를 추가한다.
- [x] 큐 경로가 검증될 때까지 기존 POS/알림 동작은 유지한다.

## 2차 PR 범위

- [x] POS 전송 side effect를 queue consumer로 이동한다.
- [x] retry와 실패 상태를 추가한다.
- [x] 관리자에서 POS 전송 실패를 볼 수 있게 한다.
- [x] 필요하면 수동 재시도 경로를 추가한다.

## 3차 PR 범위

- [x] 알림 작업 생성과 dedupe 기록을 queue consumer로 이동한다.
- [x] 알림 dedupe key를 추가한다: `recipientId + notificationType + orderId`.
- [x] 내부 retry/failure 이벤트가 고객 알림을 발생시키지 않도록 보장한다.
- [x] 실제 알림 provider 발송과 성공/실패 상태 갱신을 추가한다.

## 검증 기록

- [x] `npx.cmd tsc --noEmit`
- [x] `npx.cmd prisma validate`
- [x] `npx.cmd vitest run`: **15 files / 102 tests** 통과 (2026-05-01)
- [x] `payments-e2e.spec.ts`: Toss E2E 통합 테스트 7 tests 통과

## 다음 순서

1. 운영 DB `prisma migrate deploy` — `OrderChannel.HOMEPAGE` 제거 migration 적용 (실 환경 작업)
2. GitHub Actions cron 실제 실행 로그 확인 (`POST /queue/process-once` 응답)
3. Vercel Production/Preview 환경변수 분리 상태 확인 (REDIS_URL, Firebase, Toss, Sentry)

## 최신 동기화 (2026-05-02)

- [x] 테이블오더 첫 주문/추가 주문 API 사용 경로 검증
- [x] 테이블오더 직원 호출 API `POST /stores/:storeId/tables/:tableNumber/calls` 추가 및 단위 테스트 통과
- [x] 결제 완료/환불 이벤트 발행 및 POS/MQ 후처리 흐름 정리 완료
- [x] 관리자 MQ 운영 화면용 실패 조회/재시도 API 연결 상태 반영
- [~] ~~홈페이지 직접 주문용 공개 `POST /orders/homepage` 주문 생성 엔드포인트 구현~~ → **2026-05-02 정책 전환으로 제거**: 홈페이지 직접 주문 폐기, 배달앱 리다이렉트로 단일화
- [~] ~~홈페이지 비회원 주문 생성 시 `Order.source = HOMEPAGE`, `PENDING_PAYMENT` 생성 정책~~ → **제거됨**: `CreateDeliveryOrderDto.source` 필드 삭제, HOMEPAGE 분기 삭제, 게스트 주문 차단
- [~] ~~홈페이지 Toss 결제 승인 후 POS/알림 후처리 E2E~~ → **불필요**: 홈페이지에서 결제 발생 안 함
- [ ] 테이블오더 첫 주문/추가 주문 브라우저-백엔드 E2E
- [ ] DB schema `OrderSource` enum에서 `HOMEPAGE` 값 정리 (마이그레이션 영향 검토 후 별도 작업)

## 최신 동기화 (2026-05-03) — 런칭 준비도 감사

- [x] **결함 식별**: MQ 코드는 완비됐으나 cron 트리거 부재로 런타임 미동작 (Vercel Hobby 한계)
- [x] **결함 식별**: CORS 단일 origin (admin/brand/delivery 다중 도메인 운영 시 막힘)
- [x] **결함 식별**: `.env.example` 8~64라인 중복 + `INTERNAL_JOB_SECRET` 누락
- [x] **결함 식별**: `orders.controller.ts:11-22` 인라인 enum, `any` 99개, `*.spec.ts` 19개로 핵심 도메인은 커버하나 일부 모듈 미테스트
- [x] **강점 확인**: 도메인 모델(Order/Payment/OrderDelivery 분리, idempotency, posSyncStatus, dedupeKey, retry/backoff), 단위/E2E 142 tests, SupabaseGuard 일관 적용, Sentry beforeSend 헤더 필터링
- [x] [P0] cron 트리거 도입 방안 결정 후 운영 문서화 (GitHub Actions로 구축 완료)
- [x] [P0] CORS allowed origins 환경변수를 콤마 구분 배열로 변경 (2026-05-04)
- [x] [P0] `.env.example` 정리 + 운영 secret 누락 항목 보강 (2026-05-04)

## 최신 동기화 (2026-05-04) — 운영 안정화 및 푸시 알림 계획

- [x] Vercel Shared 환경변수(All-in-one) 세팅 완료 및 오버라이드(우선순위) 원리 문서화
- [x] 구글 앱 비밀번호(App Password) 기반 메일 전송 환경변수 정리
- [x] **푸시 알림 방향성 확정**: 앱 종료 시에도 동작하는 잠금화면 알림을 위해 **Firebase Cloud Messaging(FCM) 연동 채택 (옵션 A)**
- [x] 백엔드 FCM 연동 구현: `UserDevice` 테이블 설계, `firebase-admin` 설정, 토큰 발급/삭제 API 구현 (2026-05-04)
- [x] 큐 컨슈머 연동: `notification.send` 수신 시 FCM 발송 로직 추가 (2026-05-04)
- [ ] **[인프라 고도화]** 개발(Dev)과 운영(Prod) 데이터베이스/환경 변수 물리적 분리 구조 도입 (추후 진행)
