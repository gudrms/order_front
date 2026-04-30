# 관리자 브라우저 E2E 점검표

마지막 업데이트: 2026-04-30

## 사전 조건

- 백엔드 API 서버가 실행 중이어야 한다.
- 관리자 웹이 `apps/admin` 기준 `pnpm dev` 또는 동등한 명령으로 실행 중이어야 한다.
- Supabase 관리자 계정으로 로그인할 수 있어야 한다.
- 로그인 계정은 `ADMIN` 또는 테스트 매장의 `OWNER` 권한이어야 한다.
- 테스트 매장에 배달 주문 1건 이상이 존재해야 한다.

## 공통 확인

- [ ] `/orders` 진입 시 주문 테이블이 표시된다.
  - 셀렉터: `data-testid="admin-orders-table"`
- [ ] 테스트 주문 행이 표시된다.
  - 셀렉터: `data-testid="admin-order-row-{orderId}"`
- [ ] 상세 토글 클릭 시 확장 패널이 표시된다.
  - 셀렉터: `data-testid="admin-order-detail-toggle-{orderId}"`

## 주문 상태 변경 E2E

1. `PAID` 또는 `PENDING` 상태의 주문을 준비한다.
2. 주문 상태 액션 버튼을 클릭한다.
   - 셀렉터: `data-testid="admin-order-status-action-{orderId}"`
3. 주문 상태가 `CONFIRMED`로 변경되는지 확인한다.
4. 같은 주문에서 다음 상태 액션을 다시 클릭한다.
5. 주문 상태가 `COOKING`으로 변경되는지 확인한다.
6. 배달 주문이면 다음 액션 클릭 후 `READY` 상태가 되는지 확인한다.

## 배달 상태 변경 E2E

1. 배달 주문이 `READY` 상태인지 확인한다.
2. 배달 상태 액션 버튼을 클릭한다.
   - 셀렉터: `data-testid="admin-delivery-status-action-{orderId}"`
3. `PENDING`이면 `ASSIGNED`로 변경되는지 확인한다.
4. 다음 클릭에서 `DELIVERING`으로 변경되는지 확인한다.
5. 다음 클릭에서 `DELIVERED`로 변경되고 주문 상태가 `COMPLETED`가 되는지 확인한다.
6. 배달앱 주문 상세 화면에서도 배달 상태가 갱신되는지 확인한다.

## Toss 환불 E2E

1. `PAID` 또는 `PARTIAL_REFUNDED` 상태의 Toss 결제 주문을 준비한다.
2. 전액 취소 버튼을 클릭한다.
   - 셀렉터: `data-testid="admin-refund-full-{orderId}"`
3. 사유를 입력하고 제출한다.
   - 셀렉터: `data-testid="admin-refund-submit-full"`
4. 결제 상태가 `REFUNDED`, 주문 상태가 `CANCELLED`로 변경되는지 확인한다.
5. 부분 환불은 `admin-refund-partial-{orderId}`와 `admin-refund-submit-partial`로 동일하게 검증한다.

## 매장 설정 E2E

1. `/store` 진입 후 배달 운영 값을 변경한다.
2. 저장 버튼을 클릭한다.
   - 셀렉터: `data-testid="admin-store-save"`
3. 새로고침 후 변경값이 유지되는지 확인한다.

## Toss 메뉴 동기화 E2E

1. 매장 운영 모드가 `TOSS_POS`인지 확인한다.
2. 메뉴 화면에서 동기화 버튼을 클릭한다.
   - 셀렉터: `data-testid="admin-toss-menu-sync"`
3. 동기화 로그 패널이 표시되는지 확인한다.
   - 셀렉터: `data-testid="admin-toss-menu-sync-log"`
4. 카테고리/메뉴/옵션 요약 카운트가 표시되는지 확인한다.

## 관리자 직접 메뉴 등록 E2E

1. 매장 운영 모드를 `ADMIN_DIRECT`로 변경한다.
2. 메뉴 화면에서 카테고리를 생성한다.
3. 메뉴를 생성한다.
4. 생성한 메뉴의 수정/품절/숨김/옵션 그룹 동작을 확인한다.

## 현재 미검증 항목

- [ ] 관리자 주문 상태 변경/배달 상태 변경 브라우저 E2E
- [ ] 관리자 Toss 전액/부분 환불 브라우저 E2E
- [ ] 관리자 매장 설정 브라우저 E2E
- [ ] 관리자 직접 메뉴 등록 브라우저 E2E
- [ ] Toss 메뉴 동기화 브라우저 E2E
