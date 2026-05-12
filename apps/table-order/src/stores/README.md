# table-order stores

테이블오더 앱의 클라이언트 전용 UI 상태를 Zustand로 관리합니다.

## 현재 store

| 파일 | 역할 |
|---|---|
| `uiStore.ts` | 모달, 패널, 화면 UI 상태 |
| `tableStore.ts` | 현재 테이블 컨텍스트 |
| `errorStore.ts` | 앱 전역 오류 표시 상태 |
| `index.ts` | public export |

장바구니 상태는 이 폴더에 없습니다. `@order/order-core`의 `useCartStore`를 사용합니다.

```tsx
import { useCartStore } from '@order/order-core';
import { useUiStore } from '@/stores';

const totalQuantity = useCartStore((state) => state.totalQuantity);
const openCart = useUiStore((state) => state.openCart);
```

서버 데이터는 store에 복제하지 않고 TanStack Query hook을 사용합니다.
