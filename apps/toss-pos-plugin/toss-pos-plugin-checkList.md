# Toss POS Plugin 체크리스트

마지막 업데이트: 2026-04-25

참고: Toss Place POS Plugin 가이드 기반 개발

## 현재 판단

- 목적: Toss Place POS와 우리 백엔드 주문/카탈로그를 연결하는 플러그인.
- 현재 상태: Realtime/Polling 주문 수신, 주문 등록, 카탈로그 동기화, 테스트 골격은 상당 부분 완료.
- 가장 큰 남은 일: 새 `Payment`/`OrderDelivery`/`OrderChannel` 구조에 맞춰 POS로 보낼 주문 조건과 상태 동기화를 다시 확정하는 것.

## 완료

### 프로젝트/환경

- [x] Vite 기반 플러그인 프로젝트 구성
- [x] `manifest.json` 생성
- [x] `@tossplace/pos-plugin-sdk` 설치
- [x] 브라우저 타깃 TypeScript 설정
- [x] `.env`/`.gitignore` 구성
- [x] build/zip 스크립트 구성

### 주문 수신

- [x] Supabase Realtime 주문 수신 구조
- [x] Polling fallback 구조
- [x] Realtime + Polling 중복 처리 방지
- [x] 재연결 로직 존재
- [x] 주문 상태 PATCH 구조 존재

### POS SDK 주문 연동

- [x] `posPluginSdk.order.add` 호출 구조
- [x] 우리 주문 데이터를 `PluginOrderDto`로 변환
- [x] 주문 취소 이벤트 처리 구조
- [x] Toss POS 취소 이벤트를 백엔드 상태로 동기화하는 구조

### 카탈로그 연동

- [x] `catalog.getCatalogs()` 호출 구조
- [x] 카테고리/메뉴/옵션 upsert 구조
- [x] `tossMenuCode`, `tossOptionCode` 매핑 구조
- [x] catalog add/update/delete 이벤트 감지 구조

### 테스트/빌드

- [x] Vitest 테스트 존재
- [x] order/catalog 테스트 존재
- [x] `pnpm build` 구조 존재
- [x] `pnpm zip` 구조 존재

## 이번 큰그림 반영 기준

- [x] 백엔드 주문은 `Order.source`로 유입 앱을 구분할 수 있음
- [x] POS 플러그인이 처리할 대상은 주로 `source = TABLE_ORDER | DELIVERY_APP | HOMEPAGE | TOSS_SDK` 중 POS 전송이 필요한 주문
- [x] 결제 상태는 `PaymentStatus`로 분리됨
- [x] 배달 주문 상세는 `OrderDelivery`에서 조회 가능
- [x] `okpos*` 명명은 더 이상 사용하지 않고 `toss*`로 정리
- [x] Toss Payments 승인/실패 처리는 POS 플러그인이 아니라 백엔드 공통 `PaymentsModule`에서 담당

## 남은 일

### P0: POS 전송 조건 재정의

- [ ] POS 전송 대상 상태 결정: `PAID`, `CONFIRMED`, 현장결제 `PENDING` 중 어디까지 보낼지 확정
- [ ] `PENDING_PAYMENT` 주문은 POS 전송 제외
- [ ] 현장 결제 주문은 관리자/매장 정책에 따라 즉시 POS 전송할지 결정
- [ ] `Payment.status`와 `Order.status` 조합별 처리표 작성
- [ ] 배달 주문의 주소/요청사항을 POS 메모로 보낼지 결정
- [ ] `paymentStatus = READY | FAILED | CANCELLED` 주문은 POS 전송 제외 정책 적용

### P1: 새 DB 응답 매핑

- [ ] `GET /pos/orders/pending` 응답에 `type`, `source`, `paymentStatus`, `delivery` 포함
- [ ] `OrderDelivery.deliveryMemo`를 POS 주문 메모에 매핑
- [ ] `Payment.method`를 POS 주문 결제 메모에 매핑
- [ ] 옵션 원본 ID(`menuOptionId`)와 Toss option code 매핑 검증
- [ ] `OrderItemOption`의 snapshot 이름/가격과 Toss catalog code 동시 활용

### P1: POS SDK 기능 보강

- [ ] `order.addMenu` 추가 주문 처리
- [ ] `order.complete` 주문 완료 처리
- [ ] `order.getOrders` 조회/상태 동기화
- [ ] POS에서 취소 시 백엔드 `cancelledAt`, `cancelReason` 기록
- [ ] POS 처리 실패 시 백엔드 error log 기록

### P1: 실기기 검증

- [ ] Toss 개발자센터 App Key 발급 확인
- [ ] 테스트 매장/POS 기기 연결
- [ ] 플러그인 zip 업로드 후 실행 확인
- [ ] Realtime 주문 수신 실기기 테스트
- [ ] 카탈로그 동기화 실기기 테스트
- [ ] 주문 취소 양방향 동기화 테스트

### P2: 운영 안정성

- [ ] 주문 전송 idempotency key 적용
- [ ] POS 등록 성공 후 `tossOrderId` 저장 정책 확정
- [ ] 실패 주문 재시도 큐 추가
- [ ] 플러그인 버전/빌드 정보 표시
- [ ] 로그 다운로드 또는 원격 로그 전송

## 다음 개발 순서

1. POS 전송 조건표 확정
2. 백엔드 `/pos/orders/pending` 응답을 새 주문 코어에 맞게 확장
3. 플러그인 주문 DTO 매핑 수정
4. Toss 실기기 주문/취소/카탈로그 E2E
5. 실패 재시도와 idempotency 보강

## 검증 필요

- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm zip`
- [ ] Toss 개발자센터 업로드
- [ ] 실 POS 기기 주문 수신
- [ ] 실 POS 기기 카탈로그 동기화
