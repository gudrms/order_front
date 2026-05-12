# @order/shared

프론트엔드 앱과 백엔드가 함께 쓰는 공통 계약 패키지입니다. 타입, API 클라이언트, 상수, 훅, 유틸리티를 제공하며 앱별 화면 상태나 주문 계산 로직은 담당하지 않습니다.

## 제공 범위

- Types: `Menu`, `Order`, `OrderDelivery`, `Payment`, `Coupon`, `Address`, `Call`, `Table`, `Store`, `ApiResponse`
- API: `address`, `admin`, `auth`, `call`, `coupon`, `devices`, `menu`, `order`, `payment`, `store`, `table`
- Hooks: `useMenuSelection`, `useGeolocation`, `useOrderStatus`
- Constants: 주문/테이블/호출 상태, 매장 관련 상수
- Utils: 금액/날짜 포맷, UUID/이메일/전화번호 검증, storage, Toss Payments helper, Daum postcode helper
- Supabase: 공통 `supabase` client

## 사용 예시

```ts
import { api, formatCurrency } from '@order/shared';
import type { Order, Payment, Store } from '@order/shared';

const menus = await api.menu.getMenus(storeId);
const label = formatCurrency(15000);

function handleOrder(order: Order, payment?: Payment, store?: Store) {
  return { order, payment, store };
}
```

API 클라이언트와 타입을 함께 써서 앱별 중복 DTO를 만들지 않는 것이 기본 원칙입니다.

## 책임 경계

| 패키지 | 책임 |
|---|---|
| `@order/shared` | 백엔드 API 계약, 공통 타입, 공통 유틸 |
| `@order/order-core` | 주문 계산, 주문 검증, 장바구니 스토어 |
| `@order/ui` | 화면 컴포넌트 |
| `apps/*` | 앱별 라우팅, 화면 조합, 앱 전용 API 분기 |

장바구니 상태는 `@order/order-core`의 `useCartStore`를 사용합니다. `@order/shared`에 Zustand 스토어를 추가하지 않습니다.

## 개발 확인

```bash
pnpm --filter @order/shared type-check
```
