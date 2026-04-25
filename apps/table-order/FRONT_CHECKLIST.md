# Table Order Front 체크리스트

마지막 업데이트: 2026-04-25

## 현재 판단

- 목적: QR/테이블 기반 매장 주문 앱.
- 현재 상태: 메뉴, 장바구니, 주문 확인/성공 컴포넌트와 Store Context 골격은 있음.
- 가장 큰 남은 일: 테이블 세션 기반 주문 생성 API를 실제 DB/공통 주문 코어와 끝까지 맞추는 것.

## 완료

### 프로젝트/API 구조

- [x] Next.js App Router 기반 앱 구성
- [x] TypeScript/Tailwind 구성
- [x] Axios API client 구성
- [x] TanStack Query 구성
- [x] Store Context 구성
- [x] URL 기반 매장 경로 구조 존재: `[storeType]/[branchId]`
- [x] MSW mock 구조 존재

### 메뉴/장바구니 UI

- [x] 메뉴 페이지 구성
- [x] 카테고리/메뉴 그리드 구성
- [x] 메뉴 상세 모달 구성
- [x] 옵션 선택 UI 구성
- [x] 장바구니 페이지 구성
- [x] 장바구니 패널/요약/수량 변경 구성
- [x] 품절 메뉴 표시 구조 존재

### 주문 UI

- [x] `OrderConfirmModal` 존재
- [x] `OrderSuccessModal` 존재
- [x] 주문 이력 카드/패널 컴포넌트 존재
- [x] 주문 완료 페이지 경로 존재
- [x] `useCreateOrder`, `useOrders` hook 존재

### 테이블/매장

- [x] 테이블 확인 컴포넌트 `TableConfirmation` 존재
- [x] 테이블 ID/매장 경로 기반 진입 페이지 존재
- [x] 직원 호출 API hook 존재

## 이번 큰그림 반영 기준

- [x] 테이블 주문은 기존 `POST /stores/:storeId/orders/first`, `POST /stores/:storeId/orders/:sessionId` 계열 유지
- [x] 새 DB 구조에서 테이블 주문은 `Order.type = TABLE`, `Order.source = TABLE_ORDER`
- [x] 배달 주문용 `Payment`/`OrderDelivery` 추가가 테이블 주문을 깨지 않도록 분리됨
- [x] 공통 `OrderStatus`에 `PENDING_PAYMENT` 등이 추가되었으므로 테이블 UI 상태 매핑도 영향 받음

## 남은 일

### P0: 실제 테이블 주문 생성

- [ ] QR 진입 시 실제 `storeId`, `tableNumber` 확정
- [ ] 첫 주문이면 세션 생성 + 주문 생성 API 호출
- [ ] 추가 주문이면 활성 세션 조회 후 추가 주문 API 호출
- [ ] 주문 생성 payload가 백엔드 `CreateOrderDto`와 완전히 일치하는지 확인
- [ ] 옵션 `optionId`를 서버 검증 가능한 실제 ID로 전달
- [ ] 주문 성공 후 장바구니 비우기
- [ ] 주문 성공 후 주문번호/테이블번호 표시

### P1: 주문 이력/상태

- [ ] `useOrders`를 mock/localStorage가 아닌 백엔드 API로 전환
- [ ] 테이블 현재 세션 주문 목록 조회 연결
- [ ] 주문 상세에서 옵션/수량/가격 표시
- [ ] 주문 상태 tracker 연결
- [ ] `PENDING_PAYMENT`는 테이블 주문에서는 숨기거나 별도 처리

### P1: 직원 호출

- [ ] 직원 호출 API 실제 백엔드 연결 확인
- [ ] 호출 종류 선택 UI 정리
- [ ] 호출 완료/처리중 상태 표시
- [ ] 관리자/운영 화면과 Realtime 연결

### P1: Store Context 정리

- [ ] `storeType`, `branchId`로 실제 Store UUID 조회
- [ ] fallback `store-1` 제거
- [ ] 없는 매장/비활성 매장/영업 종료 처리
- [ ] 테이블 번호 유효성 검증

### P2: UX/오류 처리

- [ ] 네트워크 오류 toast 정리
- [ ] 주문 중복 클릭 방지
- [ ] 메뉴 품절/옵션 품절 실시간 반영
- [ ] 모바일 viewport/키오스크 화면 테스트
- [ ] 접근성 기본 점검

## 다음 개발 순서

1. QR 진입에서 실제 Store UUID와 tableNumber 확정
2. `useCreateOrder`를 백엔드 테이블 주문 API와 최종 정렬
3. 주문 성공/이력/상세를 실제 API로 연결
4. 직원 호출을 실제 운영 화면과 연결
5. mock 제거 및 E2E 테스트 추가

## 검증 필요

- [ ] 테이블오더 타입체크
- [ ] 테이블오더 빌드
- [ ] QR 진입 E2E
- [ ] 첫 주문 생성 E2E
- [ ] 추가 주문 E2E
- [ ] 직원 호출 E2E
