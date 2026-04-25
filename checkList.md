# Taco Mono 루트 체크리스트
마지막 업데이트: 2026-04-26

## 큰 그림

하나의 백엔드 주문 코어 위에 배달앱, 테이블오더, 홈페이지, 관리자 페이지, Toss SDK/POS 앱을 붙이는 구조로 간다.

- [x] `apps/backend`: 공통 API, 매장, 메뉴, 주문, 결제, 세션, Toss 연동
- [x] `apps/delivery-customer`: 고객 배달 주문 앱
- [x] `apps/table-order`: QR 기반 테이블오더
- [x] `apps/brand-website`: 홈페이지와 주문 진입
- [x] `apps/admin`: 매장/주문/메뉴 관리자
- [x] `apps/toss-pos-plugin`: Toss SDK/POS 연동 앱
- [x] `packages/shared`: 프론트 공통 타입/API/스토어
- [ ] `packages/order-core`: 공통 주문 비즈니스 로직 패키지로 실제 구현 확장

## 공통 도메인

- [x] 모든 주문은 `Order`를 중심으로 저장
- [x] 결제 시도/승인/실패 기록은 `Payment`로 분리
- [x] 배달 주소/수령자/배송 상태는 `OrderDelivery`로 분리
- [x] 주문 채널은 `OrderChannel`로 구분
- [x] 주문 타입은 `OrderType`으로 구분
- [x] 테이블 주문은 `Order.type = TABLE`, `Order.source = TABLE_ORDER`
- [x] 배달앱 주문은 `Order.type = DELIVERY`, `Order.source = DELIVERY_APP`
- [x] 결제 상태는 `PaymentStatus`, 주문 상태는 `OrderStatus`, 배달 상태는 `DeliveryStatus`로 분리
- [x] `okpos*` 명칭은 개발 부산물로 보고 신규 설계에서 제외
- [x] `tossOrderId`, `tossBranchCode` 중심으로 Toss 명칭 정리
- [x] 주문번호는 매장별 유니크 제약으로 변경
- [ ] 홈페이지 직접 주문 시 `Order.source = HOMEPAGE` 적용
- [ ] Toss SDK/POS 직접 주문 시 `Order.source = TOSS_SDK` 또는 별도 채널 정책 확정
- [ ] 관리자 수기 주문 시 `Order.source = ADMIN` 적용

## 백엔드 완료

- [x] Prisma schema validate 통과
- [x] Prisma client generate 통과
- [x] 백엔드 TypeScript 타입체크 통과
- [x] 개발 DB migration 적용 완료
- [x] `Payment`, `OrderDelivery`, delivery/payment enum 추가
- [x] Store 배달 운영 필드 추가
- [x] `User.role` 기본값을 `USER`로 변경
- [x] 초대코드 기반 매장 소유자 등록 흐름 추가
- [x] 잘못된 초대코드 거부
- [x] 매장 생성/수정/내 매장 조회 API 추가
- [x] 매장 초대코드 재발급 API 추가
- [x] 매장 테이블 일괄 생성 API 추가
- [x] 테이블 세션 시작 시 매장 활성 상태, 테이블 존재 여부, 예약 상태 검증
- [x] 배달 주문 생성 시 매장 활성 상태, 배달 가능 여부, 최소 주문금액 검증
- [x] Toss 결제 승인 API `POST /payments/toss/confirm`
- [x] Toss 결제 실패 API `POST /payments/toss/fail`
- [x] Toss secret env fallback 지원: `TOSS_PAYMENTS_SECRET_KEY`, `TOSS_SECRET_KEY`, `TOSS_ACCESS_SECRET`
- [x] Swagger DTO/API 문서 일부 보강
- [x] 매장/인증/주문/세션/결제 단위 테스트 추가
- [ ] 주문 생성 응답 mapper 정리
- [x] 주문 상세 API 추가
- [x] 배달 주문 목록 API 추가
- [ ] 배달 상태 변경 API 추가
- [ ] 주문 취소/환불 API 추가
- [ ] 결제 timeout/pending 만료 처리 추가
- [ ] POS pending orders API를 새 주문 코어 기준으로 확장

## 앱별 현재 상태

### 배달앱

- [x] 메뉴/장바구니/주소/결제/주문완료/주문내역 UI 존재
- [x] 현장결제 배달 주문 E2E 확인
- [x] Toss 결제 success/fail 서버 검증 흐름 연결
- [x] 주문 payload에 배달 주소, 연락처, 요청사항, optionId 포함
- [x] 백엔드가 매장 배달 가능 여부와 최소 주문금액을 검증
- [x] 하드코딩된 `store-1` 제거
- [x] Store Context를 환경변수 또는 매장 경로 기반 조회로 연결
- [x] 매장별 배달비/최소 주문금액을 체크아웃 금액과 주문 가능 여부에 반영
- [x] 주문 생성 응답 타입과 프론트 주문 상세 타입 정렬
- [x] 주문내역/주문상세를 실제 API로 전환
- [ ] 배달 추적 mock 제거
- [ ] 실제 Toss 테스트 결제 E2E 확인

### 테이블오더

- [x] QR/매장 URL 기반 구조 존재
- [x] 메뉴/장바구니/주문확인/주문성공 UI 존재
- [x] 테이블 세션 시작 시 백엔드에서 매장/테이블 검증 추가
- [ ] 실제 Store UUID와 tableNumber 결정
- [ ] 첫 주문 API E2E 확인
- [ ] 추가 주문 API E2E 확인
- [ ] 주문내역/상태 API 전환
- [ ] mock 제거
- [ ] PWA 설치 테스트

### 홈페이지

- [x] 브랜드/메뉴/매장/창업 문의 페이지 존재
- [x] Navbar/Footer/SEO 기본 구조 존재
- [x] 창업 문의 server action 구조 존재
- [ ] 주문 CTA를 배달앱 매장 URL로 연결
- [ ] 메뉴/매장 페이지를 백엔드 API로 전환
- [ ] 매장별 배달 가능 여부, 배달비, 최소 주문금액 표시
- [ ] Kakao Map 실제 연동
- [ ] 홈페이지 직접 주문 여부 결정

### 관리자

- [x] 로그인/초대/초기 설정 구조 존재
- [x] 대시보드/메뉴/주문/테이블 관리 UI 존재
- [x] Realtime 주문 hook 초안 존재
- [x] 백엔드 매장 생성/수정/초대코드/테이블 생성 API 추가
- [ ] 관리자 UI를 새 매장 관리 API에 연결
- [ ] 주문 목록에서 `type`, `source`, `paymentStatus` 표시
- [ ] 주문 상세에서 `Payment`, `OrderDelivery` 표시
- [ ] 배달 운영 설정 화면 추가
- [ ] 결제/취소/환불 운영 패널 추가
- [ ] Toss 메뉴 동기화 버튼 연결

### Toss SDK/POS 앱

- [x] Vite 기반 플러그인 구조 존재
- [x] Toss POS SDK 설치
- [x] Realtime/Polling 주문 수신 구조 존재
- [x] 주문 등록 `order.add` 구조 존재
- [x] catalog sync 구조 존재
- [ ] 새 주문 코어 기준 POS 전송 조건 확정
- [ ] `PENDING_PAYMENT` 주문 POS 전송 제외
- [ ] 배달 메모/결제수단 POS 메모 매핑
- [ ] `Payment.status`와 `Order.status` 조합별 처리 작성
- [ ] 실제 POS 기기 E2E
- [ ] 실패 재시도 idempotency 보강

## 검증 기록

- [x] `apps/backend`: `tsc --noEmit`
- [x] `apps/backend`: `prisma validate`
- [x] `apps/backend`: `prisma generate`
- [x] `apps/backend`: `vitest run` 7 files, 31 tests 통과
- [x] 개발 DB `prisma migrate deploy`
- [x] 개발 DB `prisma migrate status`: up to date
- [x] 배달 현장결제 주문 생성 E2E
- [ ] 배달 카드결제 주문 생성/승인 E2E
- [ ] 테이블오더 첫 주문/추가 주문 E2E
- [ ] Toss 결제 성공/실패/timeout E2E
- [ ] Sentry 이벤트 수신 E2E
- [ ] Toss SDK/POS 실제 기기 E2E
- [ ] 각 프론트 앱 타입체크/빌드 재검증

## 다음 개발 순서

1. Toss 테스트 카드결제 성공/실패 E2E
2. 결제 timeout/pending 만료 처리
3. 주문 상태 tracker를 실제 상태 변경/Realtime 흐름에 연결
4. 관리자 매장 등록/운영 설정 화면을 백엔드 API에 연결
5. 테이블오더 실제 Store UUID/tableNumber 연결과 E2E
6. 홈페이지 주문 CTA와 매장/메뉴 API 연결

## 체크리스트 위치

- [배달앱](apps/delivery-customer/checkList_delivery.md)
- [테이블오더 Front](apps/table-order/FRONT_CHECKLIST.md)
- [테이블오더 PWA](apps/table-order/PWA_CHECKLIST.md)
- [관리자](apps/admin/CHECKLIST.md)
- [홈페이지](apps/brand-website/checkList_website.md)
- [Toss SDK/POS 앱](apps/toss-pos-plugin/toss-pos-plugin-checkList.md)
