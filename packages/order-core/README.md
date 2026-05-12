# @order/order-core

주문 관련 순수 비즈니스 로직과 장바구니 스토어를 제공하는 패키지입니다. 배달앱, 테이블오더, 관리자 등 주문을 다루는 앱에서 같은 계산/검증 규칙을 쓰기 위한 경계입니다.

## 공개 API

- `calculateOptionSubtotal`
- `calculateItemSubtotal`
- `calculateItemsSubtotal`
- `calculateDeliveryFee`
- `calculateOrderTotals`
- `validateOrderItems`
- `validateStorePolicy`
- `validateDiscount`
- `validateOrder`
- `useCartStore`

## 주문 계산 예시

```ts
import { calculateOrderTotals, validateOrder } from '@order/order-core';

const items = [
  {
    menuId: 'menu-1',
    name: '타코',
    unitPrice: 9000,
    quantity: 2,
    options: [{ name: '치즈 추가', price: 1000 }],
  },
];

const totals = calculateOrderTotals({
  items,
  storePolicy: {
    deliveryFee: 3000,
    freeDeliveryThreshold: 30000,
  },
});

const result = validateOrder({
  flow: 'DELIVERY',
  items,
  storePolicy: {
    isActive: true,
    isDeliveryEnabled: true,
    minimumOrderAmount: 12000,
  },
});
```

## 장바구니 예시

```tsx
import { useCartStore } from '@order/order-core';

function CartSummary() {
  const totalPrice = useCartStore((state) => state.totalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  return <button onClick={clearCart}>총 {totalPrice}원 비우기</button>;
}
```

## 책임 경계

| 영역 | 위치 |
|---|---|
| API 타입과 DTO | `@order/shared` |
| 주문 계산/검증 | `@order/order-core` |
| 장바구니 상태 | `@order/order-core` |
| API 호출/라우팅/화면 상태 | 각 `apps/*` |
| DB 저장/외부 결제/큐 처리 | `apps/backend` |

이 패키지는 HTTP 호출, Supabase 호출, 라우팅, 화면 전용 상태를 포함하지 않습니다.
