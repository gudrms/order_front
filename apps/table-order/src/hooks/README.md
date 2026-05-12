# table-order hooks

테이블오더 앱 전용 React Query hook을 관리합니다.

## 현재 hook

| 경로 | 역할 |
|---|---|
| `queries/useMenus.ts` | 매장 메뉴 조회 |
| `queries/useOrders.ts` | 테이블별 주문 내역 조회 |
| `mutations/useCreateOrder.ts` | 첫 주문/추가 주문 생성 |
| `mutations/useCreateCall.ts` | 직원 호출 생성 |

## 기준

- 서버 상태는 TanStack Query를 사용합니다.
- 주문 생성 후에는 `['orders', 'table', storeId, tableNumber]` 범위만 무효화합니다.
- 장바구니 상태는 이 폴더에 만들지 않고 `@order/order-core`의 `useCartStore`를 사용합니다.
- 인증 상태는 테이블오더 앱의 책임이 아니며 관리자 인증은 `apps/admin`에서 관리합니다.

## 사용 예시

```tsx
import { useMenus } from '@/hooks/queries/useMenus';
import { useCreateOrder } from '@/hooks/mutations/useCreateOrder';

const { data: menus } = useMenus(storeId);
const createOrder = useCreateOrder();
```
