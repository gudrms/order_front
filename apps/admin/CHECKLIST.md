# 관리자 체크리스트

마지막 업데이트: 2026-04-30 (옵션 그룹/옵션 CRUD)

## 현재 요약

- 관리자 앱은 Supabase 로그인, 초기 프로필 설정, 대시보드/주문/메뉴/매장 화면 골격을 갖고 있다.
- 서버 상태는 TanStack Query로 관리하고, 선택 매장 같은 클라이언트 UI 상태는 Zustand로 관리한다.
- `GET /stores/me` 결과를 공통 관리자 Store Context로 묶었고, 주문/메뉴/매장 화면이 같은 선택 매장을 기준으로 동작하도록 정리 중이다.
- 메뉴 운영 방식은 `TOSS_POS`와 `ADMIN_DIRECT`를 선택할 수 있게 백엔드 기준선을 추가했다.
- 매장 관리 화면에서 배달 운영 설정, 메뉴 관리 방식, 초대 코드 재발급을 수정할 수 있다.
- 메뉴 관리 화면은 운영 방식에 따라 Toss 메뉴 동기화 또는 관리자 직접 카테고리/메뉴 등록 UI를 분기한다.

## 완료

- [x] 로그인/초대/초기 설정 화면 구성
- [x] 대시보드 UI
- [x] 메뉴 관리 UI 기본 구성
- [x] 주문 관리 UI
- [x] 테이블 관리 UI 기본 구성
- [x] Realtime 주문 hook 초안
- [x] 주문 영수증 출력 컴포넌트 구성
- [x] 백엔드 매장 생성 API `POST /stores`
- [x] 백엔드 내 매장 조회 API `GET /stores/me`
- [x] 백엔드 매장 수정 API `PATCH /stores/:storeId`
- [x] 백엔드 초대 코드 재발급 API `POST /stores/:storeId/invite-code`
- [x] 백엔드 테이블 일괄 생성 API `POST /stores/:storeId/tables/bulk`
- [x] 초대 코드 기반 owner 등록 로직
- [x] 잘못된 초대 코드 거절
- [x] 주문 목록에서 `type`, `source`, `paymentStatus` 표시
- [x] 주문 목록에서 `OrderDelivery` 배송 정보 표시
- [x] 주문 관리 화면에서 주문 상태 변경 API 연결
- [x] 주문 관리 화면에서 배달 상태 변경 API 연결
- [x] 라이더가 물건을 가져간 시점에 관리자 버튼으로 `DELIVERING` 전환 및 배달앱 상태 갱신
- [x] 주문 관리 화면에서 결제 완료 주문 전액 취소/부분 환불 API 연결
- [x] 백엔드 Toss 결제 취소/환불 API `POST /payments/orders/:orderId/toss/cancel`
- [x] `Store.menuManagementMode` 추가: `TOSS_POS` / `ADMIN_DIRECT`
- [x] `TOSS_POS` 모드에서는 Toss 동기화 메뉴만 고객 화면에 노출
- [x] `ADMIN_DIRECT` 모드에서는 관리자 직접 등록 메뉴 노출
- [x] 관리자 직접 카테고리 생성 API `POST /stores/:storeId/categories`
- [x] 관리자 직접 메뉴 생성 API `POST /stores/:storeId/menus`
- [x] 관리자 직접 메뉴 수정 API `PATCH /stores/:storeId/menus/:menuId`
- [x] 관리자 전용 메뉴 목록 API `GET /stores/:storeId/admin/menus`
- [x] 권한 헬퍼 추가: 현재 `ADMIN`/`OWNER` 유지, 향후 역할 확장 지점 분리
- [x] 관리자 앱 `QueryClientProvider` 구성
- [x] 선택 매장 상태를 Zustand로 분리
- [x] `GET /stores/me` 결과를 공통 Store Context로 연결
- [x] 매장 수정/배달 운영 설정 화면 연결
- [x] 매장 운영 모드 스위치 UI 연결
- [x] 초대 코드 재발급 UI 연결
- [x] Toss 메뉴 동기화 버튼 연결
- [x] 관리자 직접 카테고리/메뉴 등록 UI 연결
- [x] 직접 등록 메뉴 수정/품절/숨김 처리 UI 연결
- [x] 백엔드 테이블 목록 조회 API `GET /stores/:storeId/tables`
- [x] 테이블 일괄 생성 UI 실제 API 연결

## 남은 일

- [x] ADMIN 전용 신규 매장 등록 화면 연결
- [x] 주문 상세 화면 또는 확장 패널에서 `Payment`, `OrderDelivery` 전체 정보 표시
- [x] 주문 취소/환불 이력 상세 패널 추가
- [x] 결제 취소/부분 환불 UI를 `window.prompt` 대신 모달로 전환
- [x] 관리자 권한별 메뉴 노출 정책 정리
- [x] 메뉴 옵션 그룹/옵션 직접 등록 UI 추가
- [x] Toss POS 동기화 API 인증 가드 적용
- [x] Toss POS 동기화 결과/실패 로그 UI 표시
- [x] 테이블 QR URL을 실제 매장 `storeType/branchId` 기준으로 생성
- [x] 브라우저 기준 신규 주문 알림/알림음 토글 추가
- [x] Electron 후보 기능 검토: 백그라운드 주문 알림, 자동 소리 재생, 무음 영수증 출력 브리지 기준선 추가

## 검증 기록

- [x] `apps/backend`: `tsc --noEmit`
- [x] `packages/shared`: `tsc --noEmit`
- [x] `apps/admin`: `tsc --noEmit`
- [x] `apps/backend`: `vitest run src/modules/orders/orders.service.spec.ts` 17 tests 통과
- [ ] 관리자 주문 상태 변경/배달 상태 변경 브라우저 E2E
- [ ] 관리자 Toss 전액/부분 환불 브라우저 E2E
- [ ] 관리자 매장 설정 브라우저 E2E
- [ ] 관리자 직접 메뉴 등록 브라우저 E2E
- [ ] Toss 메뉴 동기화 브라우저 E2E

## 다음 순서

1. 관리자 주문 상태 변경/배달 상태 변경 브라우저 E2E 검증
2. 관리자 Toss 전액/부분 환불 브라우저 E2E 검증
3. ADMIN 전용 신규 매장 등록 화면 연결
4. Electron은 주문 알림/영수증 자동 출력 요구가 확정되면 별도 패키지로 시작한다.
