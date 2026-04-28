# Taco Mono 루트 체크리스트
마지막 업데이트: 2026-04-28

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

## 확정 정책

- [x] 배달앱 결제는 Toss Payments 선결제만 허용
- [x] 배달앱 현금/만나서 결제는 MVP 범위에서 제외
- [x] 배달 주문 생성 시 `PENDING_PAYMENT`로 생성
- [x] Toss 결제 승인 성공 시 `PAID`로 확정
- [x] 결제 승인 전 배달 주문은 고객이 앱에서 직접 취소 가능
- [x] 결제 완료 후 취소/환불은 관리자 환불 승인 흐름에서 처리
- [x] POS 전송 기준은 `Order.status === 'PAID' && tossOrderId IS NULL`
- [x] `PENDING_PAYMENT` 주문은 POS 전송 제외
- [x] 엽떡앱 모티브에 맞춰 배달 주문/주문내역/주문상세는 로그인 필수
- [x] 카카오/Supabase OAuth 사용자는 로그인 후 앱 DB `User`와 자동 동기화
- [x] `okpos*` 명칭은 개발 부산물로 보고 신규 설계에서 제외

## 공통 도메인

- [x] 모든 주문은 `Order`를 중심으로 저장
- [x] 결제 시도/승인/실패/취소 기록은 `Payment`로 분리
- [x] 배달 주소/수령자/배송 상태는 `OrderDelivery`로 분리
- [x] 주문 채널은 `OrderChannel`로 구분
- [x] 주문 타입은 `OrderType`으로 구분
- [x] 테이블 주문은 `Order.type = TABLE`, `Order.source = TABLE_ORDER`
- [x] 배달앱 주문은 `Order.type = DELIVERY`, `Order.source = DELIVERY_APP`
- [x] 결제 상태는 `PaymentStatus`, 주문 상태는 `OrderStatus`, 배달 상태는 `DeliveryStatus`로 분리
- [x] 주문번호는 매장별 유니크 제약으로 변경
- [ ] 홈페이지 직접 주문 시 `Order.source = HOMEPAGE` 적용
- [ ] Toss SDK/POS 직접 주문 시 채널 정책 확정
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
- [x] 매장 생성/수정/내 매장 조회 API 추가
- [x] 매장 초대코드 재발급 API 추가
- [x] 매장 테이블 일괄 생성 API 추가
- [x] 배달 주문 생성 시 매장 활성 상태, 배달 가능 여부, 최소 주문금액 검증
- [x] 배달 현금/만나서 결제 거부
- [x] Toss 결제 승인 API `POST /payments/toss/confirm`
- [x] Toss 결제 실패 API `POST /payments/toss/fail`
- [x] 배달 주문 목록 API 추가
- [x] 주문 상세 API 추가
- [x] 결제 timeout/pending 만료 처리 추가
- [x] 배달 주문 생성/목록/상세 Supabase JWT 인증과 사용자 소유권 검증 추가
- [x] 인증 사용자 동기화 API `POST /auth/sync` 추가
- [x] 결제 승인 전 고객 주문 취소 API `PATCH /orders/:orderId/cancel` 추가
- [x] 주문 서비스 단위 테스트에 고객 취소 정책 추가
- [ ] 배달 상태 변경 API 추가
- [ ] 결제 완료 후 관리자 환불/취소 API 추가
- [ ] POS pending orders API를 새 정책 기준으로 확장

## 배달앱 상태

- [x] Store Context 기반 실제 매장 조회
- [x] `store-1` 하드코딩 제거
- [x] 매장별 배달비/무료배달/최소 주문금액 반영
- [x] 주문내역/주문상세 실제 API 전환
- [x] 주문 생성 응답 mapper 정리
- [x] Toss 선결제 전용 체크아웃으로 정리
- [x] Toss 결제 성공/실패/중단 화면과 사용자 안내 정리
- [x] Toss 결제 E2E 실행 점검표 추가
- [x] 결제 timeout/pending 만료 처리
- [x] 주문 상태 tracker 실제 상태 연결
- [x] 로그인 필수 주문 조회 정책 보강
- [x] 카카오 로그인과 Supabase user, 백엔드 User 자동 동기화
- [x] 주문상세에서 결제 승인 전 고객 취소 UI 연결
- [ ] Toss 테스트 카드결제 성공/실패 E2E
- [ ] 결제 완료 후 환불 요청/관리자 처리 UI
- [ ] 주소 조회/추가/삭제를 실제 사용자 기준으로 동작
- [ ] 찜 조회/추가/삭제를 실제 사용자 기준으로 동작
- [ ] 쿠폰/포인트 데이터 정책 결정
- [ ] PWA 빌드/설치 검증

## 단계별 남은 일

- [ ] 관리자: 매장 등록/운영 설정 화면을 백엔드 API에 연결
- [ ] 관리자: 결제 완료 주문 취소/환불 처리 패널 구현
- [ ] 테이블오더: 실제 Store UUID/tableNumber 연결과 첫 주문/추가 주문 E2E
- [ ] 홈페이지: 주문 CTA를 배달앱 매장 URL로 연결
- [ ] 홈페이지: 매장/메뉴 API 연결
- [ ] Toss SDK/POS 앱: 실기기 E2E와 Claude 진행분 기준 최종 충돌 점검
- [ ] 공통: Swagger 명세 보강
- [ ] 공통: 주요 API 테스트 코드 보강

## 검증 기록

- [x] `apps/backend`: `tsc --noEmit`
- [x] `apps/backend`: `vitest run src/modules/orders/orders.service.spec.ts` 14 tests 통과
- [x] `apps/backend`: `vitest run src/modules/auth/auth.service.spec.ts` 5 tests 통과
- [x] `apps/backend`: `vitest run src/modules/payments/payments.service.spec.ts` 8 tests 통과
- [ ] `apps/backend`: 최신 전체 `vitest run`은 `menus.service.spec.ts` 메뉴 상세 테스트 1건 실패. POS/catalog 작업자 영역이라 본 작업에서는 미수정.
- [x] `apps/delivery-customer`: `tsc --noEmit`
- [x] `packages/shared`: `tsc --noEmit`
- [x] 개발 DB `prisma migrate deploy`
- [x] 개발 DB `prisma migrate status`: up to date
- [ ] 공식 검증 필요: 배달 카드결제 주문 생성/승인 E2E
- [ ] Toss 결제 성공/실패/timeout E2E
- [ ] Sentry 이벤트 수신 E2E
- [ ] Toss SDK/POS 실제 기기 E2E

## 다음 개발 순서

1. 배달 상태 변경 API와 관리자/고객 상태 표시 연결
2. 결제 완료 후 관리자 환불/취소 API와 UI
3. 주소 CRUD를 로그인 사용자 기준 실제 API로 전환
4. 찜/즐겨찾기를 로그인 사용자 기준 실제 API로 전환
5. Toss 테스트 카드결제 성공/실패 E2E
6. Sentry/PWA E2E 검증

## 체크리스트 위치

- [배달앱](apps/delivery-customer/checkList_delivery.md)
- [테이블오더 Front](apps/table-order/FRONT_CHECKLIST.md)
- [테이블오더 PWA](apps/table-order/PWA_CHECKLIST.md)
- [관리자](apps/admin/CHECKLIST.md)
- [홈페이지](apps/brand-website/checkList_website.md)
- [Toss SDK/POS 앱](apps/toss-pos-plugin/toss-pos-plugin-checkList.md)
