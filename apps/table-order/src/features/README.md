# table-order features

테이블오더 화면을 기능 단위로 나눈 영역입니다. 각 feature는 화면 컴포넌트, feature 전용 hook, public export를 함께 관리합니다.

## 현재 구조

| 경로 | 역할 |
|---|---|
| `menu/` | 메뉴 목록, 카테고리, 메뉴 상세, 호출 UI |
| `cart/` | 장바구니 패널, 장바구니 아이템, 주문 요약 |
| `order/` | 주문 확인, 주문 성공, 주문 내역 |

관리자 기능은 `apps/admin`에서 관리합니다. `apps/table-order` 안에 `admin/` feature를 만들지 않습니다.

## feature별 기준

- `components/`: feature 전용 UI 컴포넌트
- `hooks/`: feature 내부에서만 쓰는 hook
- `layout/`: 메뉴 화면처럼 큰 화면 구조를 나누는 컴포넌트
- `index.ts`: 외부에서 사용할 public export

## 사용 예시

```tsx
import { MenuGrid } from '@/features/menu/components';
import { CartPanel } from '@/features/cart/components';
import { OrderHistoryPanel } from '@/features/order/components/OrderHistoryPanel';
```

공통 타입은 `@order/shared`, 장바구니 상태는 `@order/order-core`, 공통 UI는 `@order/ui`에서 가져옵니다.
