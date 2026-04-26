# 배달앱 체크리스트
마지막 업데이트: 2026-04-26

## 현재 요약

- 배달앱 결제 정책은 **토스페이먼츠 선결제만 허용**한다.
- 만나서 결제/현금 결제는 MVP 범위에서 제외한다.
- 가장 큰 남은 일은 Toss 카드결제 E2E, 비로그인 주문 조회 정책 보강, 배달 취소 정책 정리다.

## 완료

- [x] Next.js App Router 기반 앱 구성
- [x] PWA/Capacitor/Sentry 설정 파일 존재
- [x] React Query Provider 구성
- [x] Supabase Auth Context 구성
- [x] 메뉴/카테고리/장바구니/주소/결제/주문내역/주문상세 UI 구성
- [x] Toss Payment Widget UI 연결
- [x] 배달 주문 payload에 주소, 연락처, 요청사항 포함
- [x] 옵션 payload에 `optionId` 포함
- [x] 백엔드 `POST /orders` 배달 주문 생성 연결
- [x] 배달 주문은 `Order.type = DELIVERY`, `Order.source = DELIVERY_APP`
- [x] 결제 시도는 `Payment`에 저장
- [x] 배달 정보는 `OrderDelivery`에 저장
- [x] 카드결제는 `PENDING_PAYMENT` 주문 생성 후 서버 승인으로 `PAID` 확정
- [x] 결제 실패/중단은 서버에 실패 기록
- [x] 배달 주문에서 현금/만나서 결제 경로 제거
- [x] 백엔드에서 배달 `CASH` 주문 거부
- [x] 백엔드가 매장 활성 상태, 배달 가능 여부, 최소 주문금액 검증
- [x] Store Context 추가
- [x] `NEXT_PUBLIC_STORE_ID` 또는 `NEXT_PUBLIC_STORE_TYPE`/`NEXT_PUBLIC_BRANCH_ID` 기반 매장 조회
- [x] 메뉴/카테고리/체크아웃이 Store Context의 실제 storeId 사용
- [x] 체크아웃에서 매장별 최소 주문금액/배달비/무료배달 기준 반영
- [x] 백엔드 배달 주문 목록 API 추가
- [x] 백엔드 주문 상세 API 추가
- [x] shared 주문 mapper 추가
- [x] 주문내역 페이지를 실제 API로 전환
- [x] 주문상세 페이지를 실제 API로 전환
- [x] 결제 `PENDING_PAYMENT` timeout/만료 처리 API 추가
- [x] 주문 상태 tracker를 실제 주문 상세 API polling과 Supabase Realtime 병행 구조로 연결

## 남은 일

### P0: 결제 안정화

- [ ] 실제 Toss 테스트 카드결제 성공 E2E
- [ ] 실제 Toss 테스트 카드결제 실패/취소 E2E
- [x] 결제 timeout/pending 만료 처리
- [ ] 중복 callback/idempotency 재시도 정책 보강
- [ ] 결제 승인 실패 시 사용자 안내 UI 정리

### P1: 주문 상태와 조회 정책

- [x] 주문 상태 tracker를 실제 주문 상태와 연결
- [x] Realtime 또는 polling 기반 주문 상태 갱신 연결
- [ ] 비로그인 주문 조회 정책 확정
- [ ] 주문 취소 요청 정책 확정
- [ ] 배달 상태 변경 API 연결

### P2: 사용자 기능

- [ ] API client에 Supabase access token 주입
- [ ] 주소 조회/추가/삭제를 실제 사용자 기준으로 동작
- [ ] 찜 조회/추가/삭제를 실제 사용자 기준으로 동작
- [ ] `test-user-id` 제거
- [ ] 쿠폰/포인트 데이터 정책 결정

### P2: PWA/빌드

- [ ] `ReferenceError: location is not defined` 빌드 로그 원인 제거
- [ ] manifest icon 경로와 실제 asset 정합성 확인
- [ ] Service Worker 캐싱 전략 검증
- [ ] Android 프로젝트 생성/동기화 검증
- [ ] iOS 프로젝트 생성 검토
- [ ] FCM/APNS/Deep Link 설정

## 검증 기록

- [x] 배달앱 TypeScript 타입체크 통과
- [x] shared TypeScript 타입체크 통과
- [x] 백엔드 TypeScript 타입체크 통과
- [x] 백엔드 `vitest run`: 8 files, 41 tests 통과
- [x] 백엔드 Prisma validate/generate 통과
- [x] 개발 DB migration 적용 완료
- [x] 과거 검증: 현장결제 배달 주문 생성 E2E 통과
- [ ] 공식 검증 필요: 카드결제 주문 생성/승인 E2E
- [ ] 주문내역/상세 실제 API E2E
- [ ] Sentry 이벤트 수신 E2E
- [ ] PWA 설치/빌드 검증

## 다음 순서

1. Toss 테스트 카드결제 성공/실패 E2E
2. 비로그인 주문 조회 정책 보강
3. 배달 취소 정책과 UI 정리
4. Sentry 이벤트 수신 E2E
5. PWA 빌드/설치 검증
