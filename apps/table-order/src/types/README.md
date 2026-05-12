# table-order types

이 폴더에는 현재 로컬 타입 파일을 두지 않습니다.

테이블오더 앱은 공통 타입을 직접 사용합니다.

```ts
import type { Menu, Order, Table, Call } from '@order/shared';
import type { CartItem } from '@order/order-core';
```

## 기준

- 여러 앱에서 공유되는 타입은 `packages/shared/src/types`에 추가합니다.
- 주문 계산/장바구니 관련 타입은 `packages/order-core`에 둡니다.
- table-order 앱에만 필요한 좁은 타입은 해당 feature나 hook 파일 가까이에 둡니다.
- 과거 `menu.ts`, `order.ts`, `api.ts`, `table.ts`, `call.ts` 같은 로컬 중복 타입은 제거되었습니다.
