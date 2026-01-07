# @order/order-core

주문 관련 공통 프론트엔드 비즈니스 로직 패키지

## 사용하는 앱

- table-order (테이블 주문)
- delivery-customer (배달 주문)

## 포함 내용

### cart/ - 장바구니 로직
- `useCart()` - 장바구니 Zustand store
- `cartUtils.ts` - 가격 계산, 옵션 처리

### order/ - 주문 로직
- `useOrderMutation()` - 주문 API 호출 (TanStack Query)
- `orderValidation.ts` - 프론트엔드 검증

### payment/ - 결제 로직
- `usePayment()` - 결제 처리

## 사용법

```typescript
import { useCart, useOrderMutation } from '@order/order-core';

const { addItem, items, totalPrice } = useCart();
const { mutate: createOrder } = useOrderMutation();
```

## 의존성

- `@order/shared` - 공통 타입, 유틸
- `@order/ui` - UI 컴포넌트

## 주의사항

이 패키지는 **프론트엔드 비즈니스 로직**만 포함합니다.
백엔드 로직은 `apps/backend`에 있습니다.
