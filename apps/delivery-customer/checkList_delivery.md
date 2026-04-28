# 배달앱 체크리스트

마지막 업데이트: 2026-04-28

## 현재 요약

- 배달앱 결제 정책은 **Toss Payments 선결제만 허용**한다.
- 만나서 결제/현금 결제는 MVP 범위에서 제외한다.
- 엽기떡볶이 앱 흐름을 참고해 **배달 주문, 주문내역, 주문상세는 로그인 필수** 정책으로 정리했다.
- 카카오 로그인은 Supabase Auth와 연결하고, 백엔드는 `POST /auth/sync`로 Supabase 사용자를 DB `User`에 동기화한다.
- 주문 생성/조회/상세, 결제 성공/실패/중단, 결제 전 고객 취소, 관리자 환불, 배달 상태 변경까지 기본 API/UI 연결은 완료했다.
- 이번 작업으로 주소 조회/추가/삭제/기본주소 설정을 실제 로그인 사용자 기준 API로 전환했다.

## 완료

- [x] Next.js App Router 기반 앱 구조
- [x] PWA/Capacitor/Sentry 설정 파일 존재
- [x] React Query Provider 구성
- [x] Supabase Auth Context 구성
- [x] API client Supabase access token 자동 주입
- [x] 카카오 로그인 + Supabase 사용자 + 백엔드 `User` 자동 동기화
- [x] Store Context 기반 실제 매장 조회
- [x] `store-1` 하드코딩 제거
- [x] 매장별 최소 주문금액/배달비/무료배달 기준 반영
- [x] 메뉴/카테고리/장바구니/주소/결제/주문내역/주문상세 UI 구성
- [x] Toss Payment Widget UI 연결
- [x] Toss `customerKey`를 로그인 사용자 ID 기준으로 정리
- [x] 배달 주문 payload에 주소, 연락처, 요청사항 포함
- [x] 주문 옵션 payload에 `optionId` 포함
- [x] 백엔드 `POST /orders` 배달 주문 생성 연결
- [x] 배달 주문은 `Order.type = DELIVERY`, `Order.source = DELIVERY_APP`
- [x] 결제 시도는 `Payment`에 저장
- [x] 배달 정보는 `OrderDelivery`에 저장
- [x] 카드결제는 `PENDING_PAYMENT` 주문 생성 후 서버 승인으로 `PAID` 확정
- [x] 결제 실패/중단 서버 기록
- [x] 배달 주문에서 현금/만나서 결제 경로 제거
- [x] 백엔드 배달 `CASH` 주문 거부
- [x] 백엔드 매장 활성 상태, 배달 가능 여부, 최소 주문금액 검증
- [x] 배달 주문 목록 API
- [x] 주문 상세 API
- [x] shared 주문 mapper
- [x] 주문내역 페이지 실제 API 전환
- [x] 주문상세 페이지 실제 API 전환
- [x] 결제 `PENDING_PAYMENT` timeout/만료 처리 API
- [x] 주문 상태 tracker를 실제 주문 상세 API polling + Supabase Realtime 병행 구조로 연결
- [x] 결제 승인 전 고객 주문 취소 API `PATCH /orders/:orderId/cancel`
- [x] 주문상세 화면 결제 승인 전 고객 취소 UI
- [x] 취소 주문의 주문상세 상태/취소 사유 표시
- [x] 배달 상태 변경 API `PATCH /stores/:storeId/orders/:orderId/delivery-status`
- [x] 주문상세 화면 배달 상태 타임라인/메모 표시
- [x] 주문상세 화면 5초 간격 재조회로 배달 상태 갱신
- [x] 관리자 전액 취소/부분 환불 API와 버튼 연결
- [x] 사용자 주소 조회/추가/삭제/기본주소 설정 API를 Supabase 로그인 사용자 기준으로 전환
- [x] 마이페이지 주소 관리 화면을 실제 주소 API에 연결
- [x] 장바구니 주소 입력 바텀시트에서 저장 주소 선택/기본주소 자동 반영
- [x] 체크아웃 주문 payload에 `addressId` 포함
- [x] 홈 헤더 주소 표시를 기본 배달지 기준으로 전환
- [x] `test-user-id` 주소 경로 제거
- [x] 주소 API Swagger 명세 보강
- [x] 주소 서비스 단위 테스트 추가

## 남은 일

### P0: 결제 안정성

- [ ] 실제 Toss 테스트 카드 결제 성공 E2E
- [ ] 실제 Toss 테스트 카드 결제 실패/취소 E2E
- [ ] 실제 Toss 테스트 결제 전액 취소/부분 환불 E2E
- [ ] 중복 callback/idempotency 재시도 정책 보강
- [ ] 결제/환불 상태를 주문내역 카드에도 노출

### P1: 사용자 기능

- [x] 주소 조회/추가/삭제/기본주소 설정을 실제 로그인 사용자 기준으로 동작
- [ ] 주소 수정 화면/API UI 연결
- [ ] 찜 조회/추가/삭제를 실제 로그인 사용자 기준으로 최종 점검
- [ ] 쿠폰/포인트 데이터 정책 결정

### P2: 운영 품질

- [ ] `ReferenceError: location is not defined` 빌드 로그 원인 제거
- [ ] manifest icon 경로와 실제 asset 정합성 확인
- [ ] Service Worker 캐싱 전략 검증
- [ ] Android 프로젝트 생성/동기화 검증
- [ ] iOS 프로젝트 생성 검증
- [ ] FCM/APNS/Deep Link 설정
- [ ] Sentry 이벤트 수신 E2E

## 검증 기록

- [x] `apps/backend`: `tsc --noEmit`
- [x] `packages/shared`: `tsc --noEmit`
- [x] `apps/delivery-customer`: `tsc --noEmit`
- [x] `apps/backend`: `vitest run src/modules/users/users.service.spec.ts` 5 tests 통과
- [x] `apps/backend`: `vitest run src/modules/orders/orders.service.spec.ts` 17 tests 통과
- [x] `apps/backend`: `vitest run src/modules/auth/auth.service.spec.ts` 5 tests 통과
- [x] `apps/backend`: `vitest run src/modules/payments/payments.service.spec.ts` 11 tests 통과
- [ ] 최신 백엔드 전체 `vitest run`: `menus.service.spec.ts` 메뉴 상세 테스트 1건 실패 이력 있음. POS/catalog 영역이라 별도 작업에서 처리 예정
- [ ] 공식 검증 필요: 카드결제 주문 생성/승인 E2E
- [ ] 주문내역/상세 실제 API E2E
- [ ] Sentry 이벤트 수신 E2E
- [ ] PWA 설치/빌드 검증

## 다음 개발 순서

1. 찜 조회/추가/삭제를 로그인 사용자 기준 실제 API로 최종 점검
2. 주소 수정 화면 추가
3. Toss 테스트 카드 결제 성공/실패/환불 E2E
4. Sentry/PWA E2E 검증
