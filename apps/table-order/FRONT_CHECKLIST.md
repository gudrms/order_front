# 테이블오더 Front 체크리스트
마지막 업데이트: 2026-05-02

## 현재 요약

- QR/테이블 기반 UI는 존재한다.
- 백엔드에서 매장 활성 상태, 테이블 존재 여부, 예약 테이블을 검증하도록 보강됐다.
- 실제 Store UUID와 tableNumber를 프론트 라우팅/QR에서 안정적으로 결정하고, 첫 주문/추가 주문 API 분기까지 연결했다.
- MQ 도입 후에도 테이블오더 프론트는 주문 생성 REST API를 사용하고, POS/알림 재시도 같은 내부 후처리는 백엔드 운영 영역으로 둔다.

## 완료

- [x] QR/매장 URL 기반 구조
- [x] 메뉴 목록 UI
- [x] 장바구니 UI
- [x] 주문 확인 UI
- [x] 주문 성공 UI
- [x] 주문 내역 컴포넌트 초안
- [x] 직원 호출 구조
- [x] Store Context 구조
- [x] 백엔드 테이블 주문 생성 API 존재
- [x] 백엔드 세션 시작 시 매장 활성 상태 검증
- [x] 백엔드 세션 시작 시 테이블 존재 여부 검증
- [x] 백엔드 세션 시작 시 예약 테이블 차단
- [x] 주문번호 매장별 유니크 제약 적용
- [x] MQ 도입 범위에서 테이블오더 프론트는 큐 직접 구독 대상이 아님을 확정
- [x] 실제 Store UUID 결정: `/:storeType/:branchId`를 백엔드 `stores/identifier` 조회로 연결하고 기본 지점 강제 리다이렉트 제거
- [x] QR에서 `tableNumber` 파싱 및 로컬 persist 저장
- [x] 첫 주문/추가 주문 API 분기 연결: 활성 세션 없음 → `orders/first`, 활성 세션 있음 → `orders/:sessionId`
- [x] 주문 내역 API 연결: 공개 `current-session` 응답의 주문 목록 사용
- [x] 직원 호출 실제 API 연결: `stores/:storeId/tables/:tableNumber/calls` 생성 endpoint와 Store Context/tableNumber 연동

## 남은 일

- [ ] 첫 주문 API 브라우저/백엔드 E2E
- [ ] 추가 주문 API 브라우저/백엔드 E2E
- [ ] 주문 상태 API 연결
- [ ] 직원 호출 Realtime/관리자 수신 화면 연결
- [ ] mock 데이터 제거
- [ ] 주문 실패/테이블 없음/예약됨 오류 UI 정리
- [ ] 결제/주문 확정 이후 POS 후처리 실패가 테이블오더 사용자 흐름을 막지 않는지 E2E 확인

## 다음 순서

1. 첫 주문/추가 주문 브라우저 E2E
2. 주문 상태 API 전환
3. 직원 호출 Realtime/관리자 수신 화면 연결
4. mock 데이터 제거
5. MQ 후처리 실패와 사용자 주문 흐름 분리 검증
