# 관리자 체크리스트
마지막 업데이트: 2026-04-26

## 현재 요약

- UI 초안은 존재하지만 백엔드 운영 API 연결이 아직 부족하다.
- 이번 업데이트로 백엔드에 매장 생성/수정/초대코드/테이블 일괄 생성 API가 추가됐다.

## 완료

- [x] 로그인/초대/초기 설정 화면 구조
- [x] 대시보드 UI
- [x] 메뉴 관리 UI
- [x] 주문 관리 UI
- [x] 테이블 관리 UI
- [x] Realtime 주문 hook 초안
- [x] 주문 영수증/출력 컴포넌트 구조
- [x] 백엔드 매장 생성 API `POST /stores`
- [x] 백엔드 내 매장 조회 API `GET /stores/me`
- [x] 백엔드 매장 수정 API `PATCH /stores/:storeId`
- [x] 백엔드 초대코드 재발급 API `POST /stores/:storeId/invite-code`
- [x] 백엔드 테이블 일괄 생성 API `POST /stores/:storeId/tables/bulk`
- [x] 초대코드 기반 owner 등록 로직
- [x] 잘못된 초대코드 거부

## 남은 일

- [ ] 관리자 로그인 후 `GET /stores/me` 연결
- [ ] ADMIN 전용 매장 등록 화면 연결
- [ ] 매장 수정 화면 연결
- [ ] 초대코드 재발급/복사 UI 연결
- [ ] 테이블 일괄 생성 UI 연결
- [ ] 주문 목록에서 `type`, `source`, `paymentStatus` 표시
- [ ] 주문 상세에서 `Payment`, `OrderDelivery` 표시
- [ ] 배달 운영 설정 화면 추가
- [ ] 배달 상태 변경 API 연결
- [ ] 주문 취소/환불 운영 패널 추가
- [ ] Toss 메뉴 동기화 버튼 연결
- [ ] 관리자 권한별 메뉴 노출 정책 정리

## 다음 순서

1. 매장 등록/수정/초대코드 API 연결
2. 테이블 일괄 생성 UI 연결
3. 주문 목록/상세를 새 주문 도메인 타입에 맞게 표시
4. 배달 운영 설정과 상태 변경 플로우 추가
