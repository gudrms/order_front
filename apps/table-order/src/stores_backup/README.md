# stores_backup

이 폴더는 과거 store 구조를 임시 보관하기 위해 남아 있는 백업 영역입니다. 신규 코드는 이 폴더를 import하지 않습니다.

현재 활성 store는 `apps/table-order/src/stores`를 기준으로 확인합니다.

- 앱 UI/table/error 상태: `apps/table-order/src/stores`
- 장바구니 상태: `@order/order-core`의 `useCartStore`
- 서버 상태: `apps/table-order/src/hooks`의 TanStack Query hook

백업 코드가 더 이상 필요 없다는 판단이 서면 별도 정리 커밋에서 폴더를 제거합니다.
