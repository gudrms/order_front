# Toss SDK/POS 앱 체크리스트
마지막 업데이트: 2026-04-28 (2차 보완)

> SDK 시그니처/이벤트/Rate Limit/사용 금지 패턴은 **README.md 의 "SDK 참고" 섹션**에 박혀 있음.
> 다음 세션은 거기부터 읽고 부족하면 `node_modules/@tossplace/pos-plugin-sdk/types/index.d.ts` → 공식 문서(`docs.tossplace.com`) 순으로 확인.

## 현재 요약

- 이 앱은 Toss SDK/POS 연동용. 결제 모듈은 백엔드 공통 `PaymentsModule` 담당, 이 앱은 POS 주문 수신/등록/동기화에 집중.
- SDK 버전: `@tossplace/pos-plugin-sdk@0.0.16`
- **결제 정책 (확정, 2026-04-26)**: 배달은 **토스페이먼츠 카드 결제만**. 현금/만나서결제 미수용.
  - POS 전송 조건: `Order.status === 'PAID' && tossOrderId IS NULL` 단일 룰
  - `PENDING_PAYMENT`는 자동으로 POS 제외 (결제 미완료라 어차피 안 보냄)
  - `payment.add`는 `sourceType: 'EXTERNAL'` 단일 분기로 충분 (배달앱이 토스페이먼츠로 이미 결제 완료한 상태이므로)
- 테스트: 플러그인 vitest **30** / 백엔드 vitest **52** 모두 그린. 빌드 통과 (dist/main.js 503kB / gzip 124kB)
- **출시 전 남은 항목 = #9 실기기 E2E 단 하나** (수동 작업)

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
- [x] **#8** Idempotency 보강. 플러그인이 `Idempotency-Key: order-{orderId}-{status}` 헤더 전송. 백엔드는 (a) 동일 status + 동일 tossOrderId면 기존 레코드 즉시 반환(no-op), (b) 다른 tossOrderId 덮어쓰기 시도면 `409 Conflict`. 플러그인은 409 받으면 `posPluginSdk.order.cancel`로 자기가 만든 중복 토스 주문을 취소. `pos.controller.spec.ts` 신설(5 케이스).
- [x] **#10** 메뉴 데이터 ownership 정책: **토스 POS가 single source of truth**. SDK 0.0.16의 `Catalog`는 read-only(get/on)이라 양방향 매핑 불가 — 옵션(a) 단방향 채택. 백엔드 `getMenus`/`getMenuDetail`에 `tossMenuCode != null` 필터 추가 (admin이 우회 생성한 잔존 메뉴는 고객 노출 차단). admin 메뉴 페이지에서 추가/수정/삭제 버튼 제거 + "POS에서 관리됩니다" 안내 배너 + 빈 상태 안내. 깨진 `/menu/new` 페이지 삭제(백엔드 POST 엔드포인트 부재로 어차피 동작 안 함). `menus.service.spec.ts`에 필터 케이스 + admin-only 메뉴 null 반환 케이스 추가.

### 추가 신뢰성 보강 (2026-04-28)

코드 리뷰 중 발견한 진짜 버그 + 운영 안정성 이슈 정리.

- [x] **payment.add 실패 시 orphan 토스 주문 정리** (`src/order.ts`). `order.add` 성공 후 `payment.add`가 throw하면 토스 POS에 결제 누락 주문이 떠돌고 다음 폴링에서 같은 주문을 또 처리해 중복 등록 → 실패 즉시 `posPluginSdk.order.cancel(result.id)`로 정리하고 백엔드 PATCH 미발신 (다음 폴링이 깨끗하게 재시도). 테스트 추가.
- [x] **Realtime 재연결 정합성 + 백오프**. 기존 코드는 `supabase.channel('pos-orders').subscribe()`만 호출해 listener 없는 빈 채널을 만들어 재연결돼도 콜백이 영원히 안 옴. `bindRealtimeChannel()`로 분리해 listener까지 매번 다시 박도록 수정. 백오프 5s → 10s → 20s → 40s → 60s(cap), `SUBSCRIBED` 시 리셋. 중복 setTimeout 가드, `CLOSED`도 재연결 트리거에 포함, `pollingTimer` 중복 시작 방지.
- [x] **PATCH FAILED 시 orphan 정리**. `updateOrderStatus`가 3회 모두 실패하면 토스 POS에는 order+payment 등록 + DB tossOrderId 미반영 → 다음 폴링에서 백엔드 409 가드에 막혀 무한 루프. `'FAILED'` 반환 시 토스 주문을 cancel하고 `posPluginSdk.toast.open`으로 운영자 알림.

### 코드 리뷰 보강 (2026-04-28 2차) — 실기기 E2E 직전 픽스

코드를 줄 단위로 다시 보면서 발견한 진짜 버그 위주로 정리.

- [x] **#1 옵션 매핑 키 충돌 — 데이터 오염 차단** (`pos.controller.ts:getPendingOrders`). 기존 `menuOptionMap`이 `name`만으로 키 매핑해서 다른 메뉴에 같은 옵션명("기본", "보통" 등)이 있으면 마지막 메뉴의 `tossOptionCode`로 덮어써져 잘못된 옵션이 POS에 전송됨 → 사장님이 손님 음식 잘못 만드는 진짜 버그. 키를 `(menuId, optionGroupName, optionName)` 3종 복합으로 변경. 회귀 테스트 신규 1.
- [x] **#2 환경변수 silent fallback 제거 + 명시적 throw** (`config.ts`). 누락된 `PLUGIN_*` 환경변수가 빈 문자열/`'YOUR_STORE_ID'` 같은 placeholder로 fallback해서 모호한 런타임 에러로 이어지던 부분 정리. `requireEnv`/`resolveApiUrl` 헬퍼로 추출. dev에서는 localhost fallback 유지, prod에서는 (a) 누락 (b) localhost를 가리키는 URL 모두 throw. 부팅 시 즉시 실패 → plugin.zip 배포 전에 발견. `config.test.ts` 신규 (11 케이스).
- [x] **#3 `pollOrders` 404 silent return 제거** (`order.ts:178`). 404는 "주문 없음"이 아니라 "라우트 자체가 없음" 의미인데 silent return하던 부분을 throw로 변경. 빈 목록은 `200 + []` 경로로만 처리. 404/5xx 모두 명확한 에러 로그(`API Error: <status> <statusText> for <url>`) 남기고 운영자가 즉시 인지 가능. 테스트 1개 제거 + 2개 추가 (404 에러 로그 / 5xx 에러 로그).

## 정정사항 (이전 추정 → 사실)

- ~~`PluginOrderDto`에 memo 필드 없음~~ → **있음**. 주문 단위(`memo`) + 라인 단위(`lineItems[].memo`) 둘 다 존재. 배달 메모는 여기 매핑.
- ~~`PluginDeliveryOrderDto`로 별도 호출~~ → 공식 문서에 별도 메서드 없음. `order.add(PluginOrderDto)` + `lineItems[].diningOption: 'DELIVERY'`가 권장 패턴.

## 남은 일

### 코드 리뷰 잔여 픽스 (실기기 E2E 전 권장)

- [ ] **#15 `updateOrderStatus` 4xx 즉시 fail** (`order.ts:158-169`). 현재 4xx도 3회 재시도해 6초 헛지연. 5xx + 네트워크 에러만 재시도.

### 코드 리뷰 잔여 픽스 (시간 되면)

- [ ] #4 #5 `(payment as any).orderId` / `as any` 캐스팅 제거 → 타입 안전성
- [ ] #6 `removeChannel` 안전한 호출 위해 channel 객체 모듈 변수 보관
- [ ] #7 polling이 fallback이 아니라 reconciliation임을 이름/주석으로 명확화
- [ ] #8 `processOrder` 함수 분해 (buildPluginOrderDto / confirmOrCleanup 등)
- [ ] #9 catalog sync 실패 alert + 백오프 (rate limit 에러 silent fail 방지)
- [ ] #10 catalogId/categoryId 변환 가드 (Number 변환 NaN 방지)
- [ ] #11~17 폴리시: magic number 모음, 로그 레벨 분리, 파일 분할 등

### #9 실기기 E2E (출시 게이트)
- 카드 결제 1건 → POS에 주문+결제 동시 등록 확인
- 배달앱에서 취소 → POS 주문도 취소되는지 확인
- POS에서 결제 취소 → 백엔드 상태 CANCELLED 반영 확인 (`payment.on('cancel')` 경유)
- 결제 timeout(15분) → 주문 자동 CANCELLED 후 POS 미등록 상태 확인 (GPT 작업분과의 통합 검증)
- 개발자센터 테스트 매장 연결 후 진행

### 향후 검토 (코드 변경 없음, 트리거 기다림)
- **SDK catalog write API**: `add`/`update`/`delete`가 노출되면 옵션(b) 양방향 매핑 재검토. `PluginCatalogItem.code`에 우리 menuId 박는 패턴 사용 가능
- **다중 옵션 그룹 자연키 한계**: 현재 `(menuId, name)`을 자연키로 쓰는데 그룹명 rename 시 별도 그룹으로 인식됨. 운영상 문제되면 `MenuOptionGroup`에 `tossOptionGroupCode` 컬럼 추가 마이그레이션 필요
- **plugin 재시작 시 in-flight 주문 idempotency**: `processingOrders` Set은 인메모리. 백엔드 409 가드 + payment.add/PATCH 실패 시 cancel로 사실상 안전하지만, 더 강한 보장이 필요하면 SDK `posPluginSdk.storage`에 진행 중 orderId 저장 검토

## 다음 순서

1. (#15) `updateOrderStatus` 4xx 즉시 fail 분기
2. (#9) 실기기 E2E — 출시 게이트, 코드로 진행 불가
3. 시간 되면 #4~#10 리뷰 잔여 픽스

## 최신 동기화 (2026-05-02)

- [x] 배달/홈페이지/테이블오더 주문 소스는 백엔드 `Order.source` 기준으로 분리
- [x] POS 전송 기준은 결제 완료 주문 및 매장 운영 모드 기준으로 정리 완료
- [x] 관리자 MQ 운영 화면에서 POS 전송 실패 조회/재시도 가능
- [ ] `updateOrderStatus` 4xx 즉시 fail 분기
- [ ] 실제 기기 E2E: 결제 주문 POS 등록, 취소 동기화, timeout 미등록 검증
- [ ] catalog sync 실패 alert/backoff 및 남은 리팩터링 항목 정리
