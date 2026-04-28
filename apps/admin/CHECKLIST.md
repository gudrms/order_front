# 관리자 체크리스트
마지막 업데이트: 2026-04-28

## 현재 요약

- 관리자 앱의 기본 UI와 Supabase 로그인 흐름은 존재한다.
- 백엔드에는 매장 생성/수정/초대코드/테이블 일괄 생성/주문 상태 변경/배달 상태 변경 API가 준비되어 있다.
- 이번 작업으로 주문 관리 화면에서 주문 타입, 주문 채널, 결제 상태, 배달 상태를 표시하고 배달 상태 변경 버튼을 연결했다.
- 결제 완료 주문의 전액 취소/부분 환불 버튼을 실제 Toss Payments 취소 API에 연결했다.
- 아직 남은 핵심은 매장 설정 화면의 실제 API 연결, 주문 상세 확장 패널, 권한별 메뉴 노출 정책이다.

## 완료

- [x] 로그인/초대/초기 설정 화면 구조
- [x] 대시보드 UI
- [x] 메뉴 관리 UI
- [x] 주문 관리 UI
- [x] 테이블 관리 UI
- [x] Realtime 주문 hook 초안
- [x] 주문 영수증 출력 컴포넌트 구조
- [x] 백엔드 매장 생성 API `POST /stores`
- [x] 백엔드 내 매장 조회 API `GET /stores/me`
- [x] 백엔드 매장 수정 API `PATCH /stores/:storeId`
- [x] 백엔드 초대코드 재발급 API `POST /stores/:storeId/invite-code`
- [x] 백엔드 테이블 일괄 생성 API `POST /stores/:storeId/tables/bulk`
- [x] 초대코드 기반 owner 등록 로직
- [x] 잘못된 초대코드 거부
- [x] 주문 목록에서 `type`, `source`, `paymentStatus` 표시
- [x] 주문 목록에서 `OrderDelivery` 핵심 정보 표시
- [x] 주문 관리 화면에서 배달 상태 변경 API 연결
- [x] 주문 관리 화면에서 결제 완료 주문 전액 취소/부분 환불 연결
- [x] 백엔드 Toss 결제 취소/환불 API `POST /payments/orders/:orderId/toss/cancel`

## 남은 일

- [ ] 관리자 로그인 후 `GET /stores/me` 결과를 공통 Store Context로 승격
- [ ] ADMIN 전용 매장 등록 화면 연결
- [ ] 매장 수정/배달 운영 설정 화면 연결
- [ ] 초대코드 재발급/복사 UI 연결
- [ ] 테이블 일괄 생성 UI 연결
- [ ] 주문 상세 화면 또는 확장 패널에서 `Payment`, `OrderDelivery` 전체 정보 표시
- [x] 결제 완료 주문 취소/환불 운영 버튼 추가
- [ ] 주문 취소/환불 이력 상세 패널 추가
- [ ] Toss 메뉴 동기화 버튼 연결
- [ ] 관리자 권한별 메뉴 노출 정책 정리

## 검증 기록

- [x] `apps/admin`: `tsc --noEmit`
- [x] `apps/backend`: `vitest run src/modules/payments/payments.service.spec.ts` 11 tests 통과
- [ ] 관리자 주문 상태 변경/배달 상태 변경 브라우저 E2E
- [ ] 관리자 Toss 전액/부분 환불 브라우저 E2E
- [ ] 관리자 매장 설정 브라우저 E2E

## 다음 순서

1. 매장 수정/배달 운영 설정 화면 연결
2. 주문 취소/환불 이력 상세 패널 추가
3. 초대코드 재발급/복사 UI 연결
4. 테이블 일괄 생성 UI 연결
5. Toss 메뉴 동기화 버튼 연결
