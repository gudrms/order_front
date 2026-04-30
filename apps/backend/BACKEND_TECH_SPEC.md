# 백엔드 기술 스펙
마지막 업데이트: 2026-05-01

## 목적

이 문서는 Taco mono 저장소의 백엔드 아키텍처와 구현 정책을 정리한다. 체크리스트는 작업 진행 상태를 추적하고, 이 스펙 문서는 목표 설계와 엔지니어링 기준을 설명한다.

## 런타임과 배포

- 런타임: Node.js 20.x.
- 프레임워크: NestJS 10 + TypeScript.
- 배포 대상: 현재 백엔드는 Vercel Node functions 기준으로 배포한다.
- 로컬 API 포트: `4000`.
- API prefix: `api/v1`.
- API 문서: `@nestjs/swagger` 기반 Swagger.

## 핵심 기술 스택

- 데이터베이스: Supabase PostgreSQL.
- ORM: Prisma 5.
- 인증: Supabase JWT를 백엔드 guard/strategy에서 검증한다.
- 검증: `class-validator`와 NestJS `ValidationPipe`.
- 로깅: Winston. error/critical 로그는 기존 Supabase log transport를 통해 영속화한다.
- 보안: Helmet, CORS, throttling/rate limiting.
- 관측성: monorepo에 Sentry가 포함되어 있으며, 주요 오류 모니터링 경로로 유지한다.

## 애플리케이션 경계

백엔드는 모든 클라이언트 surface의 명령 경계다.

- 배달 고객 앱.
- 관리자 앱.
- 테이블오더 앱.
- 브랜드 홈페이지.
- Toss POS 플러그인.

프론트 앱은 명령을 수행할 때 백엔드 REST API를 호출해야 한다. service-role credential, queue credential, 결제 secret, 직접적인 background processing 로직은 프론트가 소유하지 않는다.

## 도메인 모델

백엔드는 모든 주문을 `Order` aggregate 중심으로 저장한다.

- `Order`: 주문의 비즈니스 상태, 타입, source, 테이블/배달 소유 정보, 금액.
- `Payment`: 결제 시도, 승인, 실패, 취소, 환불 상태.
- `OrderDelivery`: 배달 주소, 수령자, 배달 lifecycle.
- `User`: Supabase auth에서 동기화된 애플리케이션 사용자.
- `Store`: 매장 설정과 운영 정책.
- `Menu`, `Category`, `OrderItem`: 메뉴 카탈로그와 주문 라인 아이템.

상태값은 명확히 분리해서 유지한다.

- `OrderStatus`: 주문 lifecycle.
- `PaymentStatus`: 결제 lifecycle.
- `DeliveryStatus`: 배달 lifecycle.
- POS/알림 sync 상태는 추가 시 핵심 비즈니스 상태와 분리해 추적한다.

## API 정책

사용자에게 즉시 검증과 응답이 필요한 명령은 REST 동기 처리로 유지한다.

- 매장/메뉴 조회.
- 배달 주문 생성과 금액 검증.
- Toss 결제 승인 endpoint.
- Toss 결제 실패 callback/return 처리.
- 관리자 주문 상태 변경.
- 관리자 환불/취소 권한 검증.
- 결제 승인 전 고객 주문 취소.

백엔드는 위 명령에 대해 명확한 비즈니스 결과를 반환해야 한다. 느리거나 실패 가능성이 큰 side effect는 백엔드가 소유한 이벤트나 큐 뒤로 이동한다.

## 결제 정책

결제 정확성은 비동기 분리보다 우선한다.

- 배달 주문은 `PENDING_PAYMENT` 상태로 생성한다.
- Toss 결제 승인은 금액과 소유권 검증을 통과한 뒤에만 payment/order 상태를 paid로 변경한다.
- `order.paid` 같은 큐 이벤트는 로컬 DB의 paid 상태가 commit된 이후에만 발행한다.
- Toss 승인 성공 후 로컬 DB 확정이 실패하면, 큐에 의존하기 전에 같은 요청 경로에서 즉시 Toss 취소/환불을 시도한다.
- 이후 reconciliation job이 로컬 결제 상태와 Toss 상태를 비교해 불일치를 복구하거나 보상한다.

## Realtime 정책

Supabase Realtime은 UI 관찰용이지 durable background work용이 아니다.

- 관리자/주문 화면은 보이는 주문과 배달 상태를 갱신하기 위해 Realtime을 사용할 수 있다.
- POS 플러그인은 현재 설계처럼 주문 변경 관찰에 Realtime을 사용할 수 있다.
- durable retry, 외부 API 호출, background workflow는 백엔드 worker/consumer가 담당한다.

## 비동기 처리 정책

백엔드는 [MQ_TECH_SPEC.md](./MQ_TECH_SPEC.md)에 정의한 MQ 설계에 따라 비동기 처리를 도입한다.

초기 비동기 처리 후보:

- POS 주문 전송.
- 고객/관리자 알림.
- 영수증 또는 이메일 발송.
- 결제 timeout 처리.
- 결제/주문 reconciliation.
- 배달 상태 변경 후처리.

## 오류 처리

- 도메인 검증 실패는 4xx 응답으로 반환한다.
- 외부 서비스 실패가 로컬 비즈니스 상태를 손상시키면 안 된다.
- 재시도 가능한 side effect 실패는 처리 상태로 저장하고 worker가 재시도한다.
- 재시도 불가능하거나 최대 재시도를 초과한 실패는 로그 또는 관리자 UI를 통해 운영자가 볼 수 있어야 한다.
- 고객-facing 메시지는 내부 retry 이벤트가 아니라 최종 비즈니스 상태를 기준으로 보낸다.

## 테스트 정책

백엔드 테스트는 다음 범위를 포함해야 한다.

- 주문 생성과 금액 검증.
- 결제 성공/실패/취소/환불 상태 전이.
- 배달 상태 전이.
- 인증 사용자 소유권 검증.
- MQ 구현 후 queue producer idempotency와 consumer 중복 처리.
- 결제 불일치 상황의 reconciliation과 compensation 경로.

## 관련 문서

- [백엔드 체크리스트](./BACKEND_CHECKLIST.md)
- [MQ 기술 스펙](./MQ_TECH_SPEC.md)
- [백엔드 README](./README.md)

