# 배달앱 체크리스트
마지막 업데이트: 2026-04-26

## 현재 요약

- UI 완성도: 약 70%
- 서버 연동 완성도: 약 55%
- 가장 큰 남은 일: `store-1` 하드코딩 제거, 주문내역/상세 API 전환, Toss 카드결제 E2E

## 완료

- [x] Next.js App Router 기반 앱 구성
- [x] PWA/Capacitor/Sentry 설정 파일 존재
- [x] React Query Provider 구성
- [x] Supabase Auth Context 구성
- [x] 메뉴 페이지와 카테고리/메뉴 목록 UI
- [x] 메뉴 상세 바텀시트와 옵션 선택 UI
- [x] 장바구니 UI와 수량 변경/삭제
- [x] 주소 입력 바텀시트와 Daum 우편번호 검색 모달
- [x] 주문자 이름/연락처/배달 요청사항 입력
- [x] 결제 페이지와 Toss Payment Widget UI
- [x] 카드결제 redirect flow 초안
- [x] 현장결제 주문 버튼
- [x] 결제 성공/실패/현장결제 완료 페이지
- [x] 주문내역/주문상세 UI
- [x] Supabase Realtime 기반 주문 상태 hook 초안
- [x] 네이티브 wrapper: camera, geolocation, push, local notification, haptics, network, share, toast, browser, status bar, app lifecycle
- [x] `packages/shared` API/type/cart/menu selection/order status hook 사용
- [x] 배달 주문 payload에 주소, 연락처, 요청사항 포함
- [x] 옵션 payload에 `optionId` 포함
- [x] 백엔드 `POST /orders` 배달 주문 생성 연결
- [x] 배달 주문은 `Order.type = DELIVERY`, `Order.source = DELIVERY_APP`
- [x] 결제 시도는 `Payment`에 저장
- [x] 배달 정보는 `OrderDelivery`에 저장
- [x] 카드결제는 `PENDING_PAYMENT` 주문 생성 후 서버 승인으로 `PAID` 확정
- [x] 결제 실패/중단은 서버에 실패 기록
- [x] 백엔드가 매장 활성 상태, 배달 가능 여부, 최소 주문금액 검증
- [x] 현장결제 배달 주문 생성 E2E 확인

## 남은 일

### P0: 매장 선택과 주문 흐름 정상화

- [ ] `store-1` 하드코딩 제거
- [ ] `NEXT_PUBLIC_STORE_ID` 또는 URL 기반 Store Context 결정
- [ ] `GET /stores/identifier/:storeType/:branchId`로 매장 조회 연결
- [ ] 매장별 배달 가능 여부, 최소 주문금액, 배달비를 UI에 반영
- [ ] 주문 생성 응답을 프론트 `OrderResponse` 타입에 맞게 mapper 정리
- [ ] 주문 생성 후 주문상세로 이동하는 흐름 안정화

### P1: 주문내역/상세 API 전환

- [ ] `useOrders`의 localStorage mock 제거
- [ ] 내 주문 목록 API 추가 후 연결
- [ ] 주문 상세 API 추가 후 연결
- [ ] Supabase 테이블 직접 조회 제거
- [ ] 주문 상태 tracker를 실제 주문 상태와 연결
- [ ] 비로그인 주문 조회 정책 확정

### P1: 결제 안정화

- [ ] 실제 Toss 테스트 카드결제 성공 E2E
- [ ] 실제 Toss 테스트 카드결제 실패/취소 E2E
- [ ] 결제 timeout/pending 만료 처리
- [ ] 중복 callback/idempotency 재시도 정책 보강
- [ ] 결제 승인 실패 시 사용자 안내 UI 정리

### P2: 사용자 기능

- [ ] API client에 Supabase access token 주입
- [ ] 주소 조회/추가/삭제를 실제 사용자 기준으로 동작
- [ ] 찜 조회/추가/삭제를 실제 사용자 기준으로 동작
- [ ] `test-user-id` 제거
- [ ] 쿠폰/포인트 데이터 정책 결정

### P2: 배달 추적

- [ ] mock delivery endpoint 제거
- [ ] 배달 상태 변경 API 연결
- [ ] Realtime 구독 활성화
- [ ] 예상 조리/배달 시간 표시
- [ ] 배달 취소 정책과 UI 정리
- [ ] 지도/라이더 위치 연동 여부 결정

### P2: PWA/빌드

- [ ] `ReferenceError: location is not defined` 빌드 로그 원인 제거
- [ ] manifest icon 경로와 실제 asset 정합성 확인
- [ ] Service Worker 캐싱 전략 검증
- [ ] Android 프로젝트 생성/동기화 검증
- [ ] iOS 프로젝트 생성 검토
- [ ] FCM/APNS/Deep Link 설정

## 검증 기록

- [x] 배달앱 TypeScript 타입체크 통과
- [x] 백엔드 TypeScript 타입체크 통과
- [x] 백엔드 `vitest run`: 7 files, 31 tests 통과
- [x] 백엔드 Prisma validate/generate 통과
- [x] 개발 DB migration 적용 완료
- [x] 현장결제 배달 주문 생성 E2E 통과
- [ ] 카드결제 주문 생성/승인 E2E 필요
- [ ] 주문내역/상세 실제 API E2E 필요
- [ ] Sentry 이벤트 수신 E2E 필요
- [ ] PWA 설치/빌드 검증 필요

## 다음 순서

1. Store Context 연결과 `store-1` 제거
2. 주문 생성 응답 mapper 정리
3. 주문 상세 API 추가 및 상세 페이지 연결
4. 내 주문 목록 API 추가 및 주문내역 연결
5. Toss 테스트 카드결제 E2E
6. 결제 timeout/pending 만료 처리
