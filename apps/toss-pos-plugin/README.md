# Toss POS Plugin

토스 POS(Toss Place) 디바이스에서 실행되는 웹앱 플러그인입니다.
배달앱 주문을 토스 POS에 자동 등록하고, 카탈로그 동기화 및 주문 취소를 양방향으로 처리합니다.

## 구조

```
src/
├── index.ts      # 초기화 (카탈로그 sync, realtime, polling, 이벤트 바인딩)
├── config.ts     # 환경변수, Supabase 클라이언트
├── catalog.ts    # 토스 POS 카탈로그 → 백엔드 동기화
├── order.ts      # 주문 처리, 상태 업데이트 (재시도/중복방지), 폴링
├── realtime.ts   # Supabase Realtime 구독 (INSERT/UPDATE), 재연결
├── types.ts      # 백엔드 API 응답 타입 (SDK 타입은 @tossplace/pos-plugin-sdk에서 import)
└── __tests__/    # vitest 테스트
```

## 동작 흐름

### 주문 등록
```
배달앱 주문 → 토스페이먼츠 결제 완료(status=PAID) → Supabase UPDATE 감지
→ posPluginSdk.order.add(PluginOrderDto)
→ posPluginSdk.payment.add({ sourceType: 'EXTERNAL', ... })   // 결제 원장도 같이
→ 백엔드 상태 CONFIRMED 업데이트
```

> **결제 정책**: 배달은 **토스페이먼츠 카드 결제만** 받음 (현금/만나서결제 안 받음).
> → POS 전송 조건은 항상 `status === 'PAID' && tossOrderId IS NULL` 한 줄로 단순.
> → `payment.add`는 `'EXTERNAL'` 단일 분기. `'CASH'`/`autocomplete: false` 분기 불필요.

### 주문 취소 (양방향)
- **배달앱 → 토스 POS**: Supabase UPDATE 감지 → `posPluginSdk.order.cancel()`
- **토스 POS → 백엔드**: `payment.on('cancel', (paymentId, orderId) => ...)` → 백엔드 상태 CANCELLED 업데이트
  > `order.on('cancel')`은 SDK에서 `@deprecated` + 공식 문서 이벤트 목록에서 제거됨. 사용 금지.

### 카탈로그 동기화
```
토스 POS 상품 → posPluginSdk.catalog.getCatalogs()
→ POST /pos/catalogs/sync → 백엔드 DB에 매핑 저장
→ 주문 시 tossMenuCode/tossOptionCode로 SDK DTO 생성
```

## SDK 참고 (`@tossplace/pos-plugin-sdk@0.0.16` 기준)

> 공식 문서: https://docs.tossplace.com/reference/plugin-sdk/pos/intro.html
> 타입 정의: `node_modules/@tossplace/pos-plugin-sdk/types/index.d.ts`
> (이 섹션은 다음 세션이 SDK 문서를 또 뒤지지 않도록 박아둔 요약. 문서 갱신 시 이 섹션도 같이 업데이트할 것.)

### Order API ([order.html](https://docs.tossplace.com/reference/plugin-sdk/pos/order.html))

```ts
order.add(dto: PluginOrderDto): Promise<PluginOrder>          // 주문 생성
order.addMenu(orderId, dto): Promise<PluginOrder>             // 기존 주문에 메뉴 추가
order.cancel(id): Promise<void>                               // 주문 취소(결제는 별도)
order.complete(id): Promise<PluginOrder>                      // autocomplete=false일 때 명시 완료
order.getOrder(id) / getOrders({ start, end, page, size, orderStates })
```

**`order.on(event, cb)` 사용 가능 이벤트** — 공식 문서 기준
`'add' | 'update' | 'accept' | 'decline' | 'expire' | 'complete'`
**`'cancel'`은 deprecated** → `payment.on('cancel', ...)`로 대체.

**`PluginOrderDto`** ([types:1316](node_modules/@tossplace/pos-plugin-sdk/types/index.d.ts:1316))
```ts
{
  memo?: string                    // 주문 단위 메모 (배달메모 매핑 위치)
  numGuests?: number
  tableId?: number
  discounts: PluginDiscount[]      // 빈 배열 가능
  lineItems: PluginOrderItemDto[]
}
```

**`PluginOrderItemDto`**
```ts
{
  diningOption: 'HERE' | 'TOGO' | 'DELIVERY' | 'PICKUP'  // 라인 단위
  item: { id, title, category, code?, type: 'ITEM' | 'DELIVERY_FEE' | 'PREPAID_CARD' | 'MULTI_USE_TICKET' }
  quantity: { value }
  chargePrice: { value }                                  // 할인 적용 후 라인 합계
  optionChoices: { id, quantity }[]                       // catalog option choice id
  discounts?: PluginDiscount[]
  memo?: string                                           // 라인 단위 메모
}
```

**`PluginOrder.orderState`**: `'REQUESTED' | 'OPENED' | 'COMPLETED' | 'CANCELLED'`
- 우리처럼 `order.add`로 직접 생성하면 `OPENED`부터 시작. `REQUESTED`/`accept`/`decline`은 토스가 외부 채널(배민 등) 받을 때만.

**`PluginDeliveryOrderDto`**는 타입에는 있지만 공식 문서에 별도 호출 메서드 없음 — `order.add(PluginOrderDto)` + `lineItems[].diningOption: 'DELIVERY'`가 권장 패턴.

### Payment API ([payment.html](https://docs.tossplace.com/reference/plugin-sdk/pos/payment.html))

```ts
payment.add(order: { id }, dto: PluginPaymentDto): Promise<PluginPayment>
payment.cancel(order: { id }, payment: { id }): Promise<void>      // 주문이 아니라 결제만 취소
payment.getPayment(paymentId)
payment.on('paid' | 'cancel', cb: (paymentId, orderId) => void)
```

**`PluginPaymentDto`** sourceType별
- `'CARD'`: `cardDetails` 필요 (브랜드/번호/타입/할부)
- `'CASH'`: `cashReceipt?` 선택
- `'EXTERNAL'`: 최소 구조 — **외부 결제(우리가 토스페이먼츠로 이미 결제한 경우)는 이걸로 등록**
- 공통: `orderId, sourceType, amountMoney, taxMoney, approvedNo, approvedAt, paymentKey, supplyMoney, tipMoney, taxExemptMoney?, autocomplete?`

**`autocomplete`** (default `true`): 결제 완료 = 주문 자동 완료. 현장결제는 `false`로 등록 후 픽업 시점에 `order.complete()` 명시 호출.

**분할 결제**: `paid`/`cancel` 이벤트는 결제마다 발생. 완납 여부는 `order.paymentPrice.paymentUnpaidValue === 0`로 판정.

### Catalog API ([catalog.html](https://docs.tossplace.com/reference/plugin-sdk/pos/catalog.html))

```ts
catalog.getCatalogs(): Promise<PluginCatalogItem[]>
catalog.getCatalog(catalogId): Promise<PluginCatalogItem>
catalog.on('add' | 'update' | 'delete', cb)                    // sold-out/on-sale은 deprecated
```

**`PluginCatalogItem.state`**: `'ON_SALE' | 'SOLD_OUT' | 'UNAVAILABLE' | 'DELETED'`
**`PluginCatalogItem.code?`**: 플러그인이 채워서 보낸 사용자 정의 키 (우리 menuId 매핑에 활용 가능)
**`options: PluginCatalogItemOption[]`**: 옵션 그룹 단위 (`isRequired`, `minChoices`, `maxChoices`, `choices: PluginCatalogItemOptionChoice[]`) — 그룹을 평탄화하면 정보 손실.

### Rate Limit ([rateLimit.html](https://docs.tossplace.com/reference/plugin-sdk/pos/rateLimit.html))

- **10 req/sec, sliding window** (이벤트 리스너 콜백은 제외)
- 초과 시 `PosPluginSdkRateLimitError`
- 카탈로그 add/update/delete가 동시 발생하는 환경에서는 `syncCatalogs()` **디바운스 필수** (500~1000ms 권장)

### 검수/배포

- 코드 배포 = `pnpm zip` → place.toss.im/developer 업로드 (별도 검수 절차는 개발자센터 화면에서 안내, SDK 문서엔 없음)
- manifest/권한은 개발자센터에서 직접 설정 (번들에 포함 안 됨)

## 환경변수 (.env)

```
PLUGIN_API_URL=http://localhost:4000/api/v1
PLUGIN_SUPABASE_URL=https://xxx.supabase.co
PLUGIN_SUPABASE_ANON_KEY=sb_xxx
PLUGIN_STORE_ID=store-1
```

Vite `import.meta.env`로 로드됩니다 (`PLUGIN_` 접두사 필수).

## 스크립트

```bash
pnpm dev       # 개발 서버 (Vite)
pnpm build     # 프로덕션 빌드 → dist/
pnpm zip       # 빌드 + dist/ 압축 → plugin.zip
pnpm test      # vitest 실행
pnpm preview   # 빌드 결과물 미리보기
```

## 배포

1. `pnpm zip` 실행 → `plugin.zip` 생성
2. [Toss Place 개발자 센터](https://docs.tossplace.com/reference/plugin-sdk/pos/intro.html) 접속
3. 플러그인 번들 업로드 → **Toss SDK 배포 완료**
4. 테스트 매장 연결 후 POS 기기에서 확인

## 테스트 방법

### 유닛 테스트
```bash
pnpm test    # vitest 13개 테스트 (order 9, catalog 4)
```

### 실기기 테스트 (POS 기기 필요)
1. 개발자센터에서 테스트 매장 연결
2. POS 기기에서 플러그인 활성화
3. Supabase `Order` 테이블에 테스트 주문 INSERT → POS 주문 표시 확인

### 간접 검증 (POS 기기 없이)
- **Supabase Dashboard > Realtime Inspector**: `pos-orders` 채널 구독 상태 확인
- **백엔드 로그**: `/pos/orders/pending`, `/pos/catalogs/sync` API 호출 확인
- **Supabase Logs**: Realtime 연결/구독 이벤트 확인

## 개발 환경 참고

- **DB 연결**: Supabase Pooler 도메인 DNS 이슈 시 IP 직접 연결 사용 (`3.39.47.126`)
- **Turbo TUI**: Windows에서 서비스 선택 불가 시 `--ui stream` 옵션 사용

## 빌드 결과물 (dist/)

웹 워커(Web Worker) 실행 환경 규격에 맞추어 `iife` 포맷의 단일 JS 파일로 빌드됩니다.
(화면이 없는 백그라운드 구동 방식이므로 `index.html` 및 `manifest.json`은 번들에 포함되지 않으며, 요구 권한 등 메타정보는 토스 플레이스 개발자 센터 화면에서 직접 설정합니다.)

```
dist/
└── main.js       # 플러그인 웹 워커 진입점 번들
```
