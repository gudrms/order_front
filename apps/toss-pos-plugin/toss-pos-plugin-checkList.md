# Toss SDK/POS 앱 체크리스트
마지막 업데이트: 2026-04-26

> SDK 시그니처/이벤트/Rate Limit/사용 금지 패턴은 **README.md 의 "SDK 참고" 섹션**에 박혀 있음.
> 다음 세션은 거기부터 읽고 부족하면 `node_modules/@tossplace/pos-plugin-sdk/types/index.d.ts` → 공식 문서(`docs.tossplace.com`) 순으로 확인.

## 현재 요약

- 이 앱은 Toss SDK/POS 연동용. 결제 모듈은 백엔드 공통 `PaymentsModule` 담당, 이 앱은 POS 주문 수신/등록/동기화에 집중.
- SDK 버전: `@tossplace/pos-plugin-sdk@0.0.16`
- **결제 정책 (확정, 2026-04-26)**: 배달은 **토스페이먼츠 카드 결제만**. 현금/만나서결제 미수용.
  - POS 전송 조건: `Order.status === 'PAID' && tossOrderId IS NULL` 단일 룰
  - `PENDING_PAYMENT`는 자동으로 POS 제외 (결제 미완료라 어차피 안 보냄)
  - `payment.add`는 `sourceType: 'EXTERNAL'` 단일 분기로 충분 (배달앱이 토스페이먼츠로 이미 결제 완료한 상태이므로)
- 테스트: 플러그인 vitest 15 / 백엔드 vitest 34 모두 그린

## 완료

### 인프라/구조
- [x] Vite 기반 플러그인 구조
- [x] Toss POS SDK 설치
- [x] Realtime/Polling 주문 수신 구조
- [x] 주문 등록 `order.add` 구조
- [x] catalog sync 구조
- [x] build/zip/test 구조
- [x] 백엔드에 Toss 결제 승인/실패 공통 API 존재
- [x] `okpos*`는 신규 개발 기준에서 제외하기로 결정
- [x] SDK 타입 + 공식 문서 1차 정독 → README "SDK 참고" 박제

### 정책/코드 정리 (2026-04-26)
- [x] 배달 흐름 CASH/만나서결제 제거 (delivery-customer types/UI/payment + 백엔드 orders.service)
- [x] 백엔드 `createDeliveryOrder`에 CASH 거부 가드 추가 (`Delivery orders only support prepaid Toss Payments`)
- [x] **#0** `order.on('cancel')` → `payment.on('cancel')` 교체 + `tossOrderId` 역조회 엔드포인트 (`GET /pos/orders/by-toss-id/:tossOrderId`) 추가
- [x] **#1** `payment.add()` 호출 추가 (`sourceType: 'EXTERNAL'`, 라인: `src/order.ts` `registerExternalPayment`)
- [x] **#2** 백엔드 `getPendingOrders` where 절을 `status: 'PAID' && tossOrderId: null`로 변경 + `payment` 필드 응답에 포함 (paymentKey/approvedNo/approvedAt/amountMoney/supplyMoney/taxMoney/tipMoney/taxExemptMoney + `note`)
- [x] **#3** Realtime UPDATE에 `PAID && !tossOrderId` 분기 추가 → 즉시 `pollOrders()` 트리거
- [x] **#4** `PluginOrderDto.memo`로 배달메모 매핑 + 미매핑 메뉴는 skip + `posPluginSdk.toast.open` 경고 + 미매핑 옵션은 filter
- [x] **#5** 카탈로그 sync 800ms 디바운스 (`scheduleSync`)
- [x] **#6** 카탈로그 state 4종 처리: `ON_SALE` / `SOLD_OUT`(soldOut) / `UNAVAILABLE`(soldOut+isHidden) / `DELETED`(isActive=false)
- [x] **#7** 옵션 그룹 보존 sync. 플러그인 페이로드를 `optionGroups: [{ id, title, isRequired, minChoices, maxChoices, choices: [...] }]` 구조로 전송, 백엔드는 `(menuId, name)` 자연키로 `MenuOptionGroup` upsert(`minSelect`/`maxSelect` 매핑, `maxChoices === -1` → 999 무제한 변환), `MenuOption`은 `(optionGroupId, tossOptionCode)`로 upsert + `state === 'SOLD_OUT' → isSoldOut: true`.

## 정정사항 (이전 추정 → 사실)

- ~~`PluginOrderDto`에 memo 필드 없음~~ → **있음**. 주문 단위(`memo`) + 라인 단위(`lineItems[].memo`) 둘 다 존재. 배달 메모는 여기 매핑.
- ~~`PluginDeliveryOrderDto`로 별도 호출~~ → 공식 문서에 별도 메서드 없음. `order.add(PluginOrderDto)` + `lineItems[].diningOption: 'DELIVERY'`가 권장 패턴.

## 남은 일

### #8 Idempotency 보강
- 현 `processingOrders` Set은 인메모리 → 재시작 시 초기화로 중복 전송 가능
- 플러그인: `PATCH /pos/orders/:id/status`에 `Idempotency-Key: order-${id}` 헤더 전송
- 백엔드: 동일 키 요청은 기존 결과 반환 (혹은 백엔드는 이미 `order.status === status && tossOrderId` 가드 있어 멱등성 일부 보장됨 — 강화 검토)

### #9 실기기 E2E (출시 게이트)
- 카드 결제 1건 → POS에 주문+결제 동시 등록 확인
- 배달앱에서 취소 → POS 주문도 취소되는지 확인
- POS에서 결제 취소 → 백엔드 상태 CANCELLED 반영 확인 (`payment.on('cancel')` 경유)
- 개발자센터 테스트 매장 연결 후 진행

### #10 catalog sync ↔ 관리자 메뉴 정책
- 관리자 페이지에서 직접 추가한 메뉴(`tossMenuCode` 없음) 처리 방침 미정
- 옵션:
  - (a) 관리자 메뉴는 POS sync 대상 외 (단방향: POS → DB만)
  - (b) `PluginCatalogItem.code`에 우리 menuId 박아 양방향 매핑

## 다음 순서

1. (#8) idempotency 키 헤더
2. (#10) 관리자 메뉴 매핑 정책 결정
3. (#9) 실기기 E2E
