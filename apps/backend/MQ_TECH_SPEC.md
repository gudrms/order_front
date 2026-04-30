# MQ 기술 스펙
마지막 업데이트: 2026-05-01

## 목적

주문/결제/POS/알림 workflow를 위해 durable한 백엔드 비동기 처리 계층을 도입한다. 목표는 단순히 비동기화를 하는 것이 아니라, 사용자-facing 명령은 안정적으로 유지하면서 재시도 가능한 side effect를 동기 API 응답 경로 밖으로 분리하는 것이다.

## 결정

첫 MQ 기술은 Supabase Queues / `pgmq`를 사용한다.

선택 이유:

- 프로젝트가 이미 Supabase PostgreSQL을 사용한다.
- `pgmq`를 사용하면 MVP 단계에서 Kafka, RabbitMQ, Redis 같은 별도 broker 운영을 피할 수 있다.
- 주문/결제 이벤트는 DB 상태와 밀접하게 연결되어 있어 기존 데이터 근처에서 추적하기 쉽다.
- 현재 필요한 것은 고용량 event streaming이 아니라 retry 가능한 durable background job이다.

대안:

- Vercel Queues: consumer를 Vercel-native queue function으로 분리할 때 적합하다. 향후 옵션으로 유지한다.
- Kafka/Redpanda: 현재는 권장하지 않는다. 현재 주문/POS/알림 요구사항에 비해 별도 streaming platform과 운영 부담이 크다.
- RabbitMQ/Redis/SQS: 가능하지만 managed service나 서버 의존성이 하나 더 생긴다. Supabase Queues가 한계가 될 때 재검토한다.

## 역할 분리

REST:

- 사용자/관리자/POS 명령 경계.
- 즉시 검증과 응답.
- 예: 주문 생성, 결제 승인, 배달 상태 변경, 취소/환불.

Supabase Realtime:

- 프론트와 POS 관찰.
- DB 상태 변경 이후 UI 갱신.
- durable worker mechanism으로 사용하지 않는다.

MQ:

- 백엔드가 소유한 side effect 처리.
- 재시도 가능한 background work.
- 사용자-facing API와 실패 격리.
- 예: POS 전송, 알림 발송, 영수증/이메일, timeout 처리, reconciliation.

## 초기 이벤트 타입

비즈니스 이벤트:

- `order.paid`
- `order.cancelled`
- `payment.paid`
- `payment.refunded`
- `delivery.status_changed`

작업 이벤트:

- `pos.send_order`
- `notification.send`
- `payment.expire_pending`
- `payment.reconcile`

내부 retry/failure 이벤트는 고객-facing 알림 트리거로 사용하지 않는다.

## 큐 구성

처음에는 단순하게 시작한다. 1차 구현은 typed queue 하나를 우선한다.

- `backend_events`

각 메시지는 다음 필드를 포함해야 한다.

```json
{
  "eventId": "uuid",
  "eventType": "order.paid",
  "idempotencyKey": "order.paid:order-id",
  "occurredAt": "2026-05-01T00:00:00.000Z",
  "payload": {
    "orderId": "order-id",
    "storeId": "store-id"
  }
}
```

트래픽이나 책임 영역이 커지면 이후 큐를 분리한다.

- `order_events`
- `payment_events`
- `pos_jobs`
- `notification_jobs`

## Producer 규칙

- 이벤트 발행은 백엔드에서만 수행한다.
- 고객/주문 side effect 이벤트는 로컬 DB transaction commit이 성공한 뒤에만 발행한다.
- `Order.status`와 `Payment.status`가 commit되기 전에는 `order.paid`를 발행하지 않는다.
- 결제 보상 이벤트는 환불/취소 상태가 commit된 뒤, 또는 복구 가능한 실패가 기록된 뒤에만 발행한다.
- producer는 안정적인 `idempotencyKey`를 사용해 중복 발행이 중복 side effect로 이어지지 않게 한다.

## Consumer 규칙

- consumer는 idempotent해야 한다.
- consumer는 at-least-once delivery 환경에서도 안전해야 한다.
- consumer는 외부 side effect를 실행하기 전에 처리 기록이나 대상 상태를 확인해야 한다.
- consumer는 시도 횟수, 마지막 오류, 최종 실패 상태를 기록해야 한다.
- consumer는 처리가 성공했거나 영구 실패로 명시적으로 표시한 뒤에만 메시지를 acknowledge/archive한다.

권장 idempotency key:

- `pos.send_order:{orderId}`
- `notification.send:{recipientId}:{notificationType}:{orderId}`
- `payment.reconcile:{paymentId}:{providerOrderId}`

## 재시도와 실패 정책

기본 동작:

- 일시적인 외부 실패는 재시도한다.
- 시도 사이에 backoff를 적용한다.
- 설정된 최대 시도 횟수 이후에는 재시도를 멈춘다.
- 운영자가 확인할 수 있도록 실패 상태를 영속화한다.

초기 권장 정책:

- visibility timeout: 60초.
- 최대 시도 횟수: POS/알림 job 기준 5회.
- backoff: 10초, 30초, 60초, 180초, 300초.
- 최대 시도 초과 시: job을 `FAILED`로 표시하고 메시지를 archive하며, 로그/관리자 화면에 실패를 노출한다.

## 결제 보상 정책

결제 승인은 일반적인 비동기 side effect가 아니다. 고객의 돈이 관련된다.

핵심 규칙:

- Toss 승인 성공 후 로컬 DB paid-state commit이 실패하면, MQ에 의존하기 전에 같은 요청 경로에서 즉시 Toss 취소/환불을 시도한다.

그 이후 MQ는 다음 용도로 사용할 수 있다.

- 보상 처리 결과 로깅.
- 고객에게 결제가 자동 취소되었음을 알림.
- 운영자 알림.
- 즉시 보상 결과를 완전히 기록하지 못한 경우 reconciliation.

고객은 외부 Toss/카드사 결제 승인 알림을 받을 수 있다. 시스템은 이를 막을 수 없다. 백엔드는 이 시간을 최소화하고 빠르게 다음 둘 중 하나로 수렴해야 한다.

- 주문/결제가 로컬에 확정됨.
- 결제가 취소/환불되고 고객에게 1회 안내됨.

## 알림 정책

고객 알림은 최종 비즈니스 상태를 기준으로 보낸다.

알림을 보내는 이벤트:

- `order.confirmed` 또는 동등한 최종 접수 상태.
- `order.cancelled`.
- `payment.refunded`.
- `delivery.started`.
- `delivery.completed`.

고객에게 알리지 않는 이벤트:

- 큐 retry 시도.
- POS retry 실패.
- 내부 DB-update 실패 이벤트.
- 일시적인 worker 실패.

중복 방지 record 또는 key를 사용한다.

- `recipientId + notificationType + orderId`

## POS 정책

POS 전송은 MQ 1차 후보로 적합하다.

이유:

- 주문/결제 성공이 POS API latency나 기기/네트워크 상태에 의존하면 안 된다.
- POS 실패는 유효한 paid order를 취소하지 않고 재시도해야 한다.
- 관리자/운영자는 POS 전송 실패를 확인하고 재시도할 수 있어야 한다.

초기 흐름:

1. 결제/주문이 `PAID`가 된다.
2. 백엔드가 `order.paid`를 발행한다.
3. consumer가 `pos.send_order`를 생성하거나 수신한다.
4. POS 전송 성공: POS sync 상태를 sent로 표시한다.
5. POS 전송 실패: 재시도한다.
6. 재시도 초과: POS sync 상태를 failed로 표시하고 관리자/운영자에게 노출한다.

## 고려할 데이터 모델 추가

Prisma/application table 후보:

- `EventProcessingLog`
- `OutboxEvent`
- `PosSyncState` 또는 `Order`의 관련 필드.
- `NotificationLog`

가능한 필드:

- `eventId`
- `eventType`
- `idempotencyKey`
- `status`: `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`
- `attemptCount`
- `lastError`
- `nextAttemptAt`
- `processedAt`

초기에는 `pgmq`만으로 충분하다면 custom table은 최소화하고, idempotency와 관리자 가시성에 필요한 상태만 추가한다.

## 구현 단계

1단계: skeleton

- `pgmq`를 활성화한다.
- `backend_events`를 생성한다.
- `QueueModule`을 추가한다.
- typed producer를 추가한다.
- 결제 DB commit 이후 `order.paid`를 발행한다.
- 처리 로그만 기록하는 최소 consumer를 추가한다.
- 기존 동작은 유지한다.

2단계: POS

- POS 전송을 queue consumer로 이동한다.
- retry/backoff를 추가한다.
- POS sync 상태와 관리자 가시성을 추가한다.
- 필요하면 수동 재시도 endpoint를 추가한다.

3단계: 알림

- 고객/관리자 알림을 queue consumer로 이동한다.
- dedupe key를 추가한다.
- 내부 retry 이벤트가 고객 알림을 발생시키지 않도록 확인한다.

4단계: 결제 복구

- Toss/local reconciliation job을 추가한다.
- 보상 처리 로깅을 추가한다.
- 불일치 상황에 대한 운영 알림을 추가한다.

## 열린 질문

- 1차 구현은 순수 `pgmq`만 사용할지, 명시적인 `OutboxEvent` table을 함께 사용할지?
- Vercel-hosted NestJS로 polling consumer를 충분히 운영할 수 있는지, 별도 scheduled worker/cron 경로가 필요한지?
- POS/알림 실패와 수동 재시도 control은 관리자 화면 어디에 노출할지?
- 고객/관리자 알림 provider는 무엇을 사용할지?

