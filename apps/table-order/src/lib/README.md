# table-order lib

테이블오더 앱의 API 조합, query provider, Supabase client, 상수, 작은 유틸을 관리합니다.

## 현재 구조

| 경로 | 역할 |
|---|---|
| `api/index.ts` | `@order/shared` API에 table-order 전용 order API를 합쳐 export |
| `api/endpoints/order.ts` | 첫 주문/추가 주문 분기 등 테이블오더 전용 주문 API |
| `query/` | TanStack Query client/provider |
| `supabase.ts` | 앱에서 사용하는 Supabase client |
| `constants/domains.ts` | 도메인/URL 관련 상수 |
| `utils/cn.ts` | className 병합 helper |
| `utils/qr-code.ts` | QR 관련 helper |
| `utils/store.ts` | store 관련 helper |

## API 기준

공통 API는 `@order/shared`를 사용합니다. `apps/table-order/src/lib/api/endpoints/`에는 table-order 앱에만 필요한 분기만 남깁니다.

```ts
import { api } from '@/lib/api';

const orders = await api.order.getOrdersByTable(tableNumber, storeId);
const menus = await api.menu.getMenus(storeId);
```

새 API가 여러 앱에서 필요하면 이 폴더가 아니라 `packages/shared/src/api`에 추가합니다.
