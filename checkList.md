# Taco Mono 루트 체크리스트

마지막 업데이트: 2026-04-26

## 목적

이 문서는 모노레포 전체의 마스터 체크리스트다. 각 앱의 세부 체크리스트는 앱 폴더에 두고, 이 파일은 전체 방향, 공통 도메인, 앱별 진행 상태, 다음 개발 순서를 한눈에 보는 기준 문서로 사용한다.

## 전체 큰그림

하나의 백엔드 주문 코어를 중심으로 여러 앱이 붙는 구조로 간다.

- `apps/backend`: 공통 API, 주문, 결제, 매장, 메뉴, 세션, POS 연동
- `apps/delivery-customer`: 고객 배달/포장 주문 앱
- `apps/table-order`: QR 기반 테이블오더 앱
- `apps/brand-website`: 브랜드 홈페이지와 주문 진입
- `apps/admin`: 점주/운영 관리자
- `apps/toss-pos-plugin`: Toss Place POS 연동 앱

## 공통 도메인 기준

- [x] 모든 주문의 공통 본문은 `Order`가 담당
- [x] 결제 시도/승인/실패/취소/환불 기록은 `Payment`가 담당
- [x] 배달 주소/수령자/요청사항/배달 상태는 `OrderDelivery`가 담당
- [x] 주문 유입 채널은 `OrderChannel`로 구분
- [x] 주문 유형은 `OrderType`으로 구분
- [x] 테이블 주문은 `Order.type = TABLE`, `Order.source = TABLE_ORDER`
- [x] 배달앱 주문은 `Order.type = DELIVERY`, `Order.source = DELIVERY_APP`
- [ ] 홈페이지 직접 주문을 만들 경우 `Order.source = HOMEPAGE` 적용
- [ ] Toss SDK 앱 직접 주문을 만들 경우 `Order.source = TOSS_SDK` 적용
- [ ] 관리자 수기 주문을 만들 경우 `Order.source = ADMIN` 적용
- [x] `okpos*` 명명은 더 이상 쓰지 않고 `toss*`로 수렴

## 공통 기반 완료

### DB/API

- [x] Prisma schema validate 통과
- [x] Prisma client generate 통과
- [x] 백엔드 TypeScript 타입체크 통과
- [x] `OrderChannel` 추가
- [x] `Payment` 모델 추가
- [x] `PaymentStatus` 추가
- [x] `PaymentProvider` 추가
- [x] `PaymentMethod` 추가
- [x] `OrderDelivery` 모델 추가
- [x] `DeliveryStatus` 추가
- [x] `OrderStatus`에 `PENDING_PAYMENT`, `PAID`, `PREPARING`, `READY`, `DELIVERING` 추가
- [x] `Store`에 배달 운영 설정 필드 추가
- [x] `UserAddress`에 수령자/연락처/좌표/메모 필드 추가
- [x] `User.role` 기본값을 `USER`로 변경
- [x] 배달 주문 생성 API `POST /orders` 추가
- [x] 기존 테이블 주문 API 유지
- [x] 과거 `okpos*` 컬럼을 `toss*`로 rename하는 migration 추가
- [x] Toss 결제 승인 API `POST /payments/toss/confirm` 추가
- [x] Toss 결제 실패 기록 API `POST /payments/toss/fail` 추가
- [x] `PaymentsModule`은 앱 공통 결제 상태/주문 상태를 담당하고, 실제 Toss HTTP 호출은 `TossApiService`로 분리
- [x] Toss Payments secret env는 `TOSS_PAYMENTS_SECRET_KEY`, `TOSS_SECRET_KEY`, 기존 `TOSS_ACCESS_SECRET` fallback 지원
- [x] Payment confirm/fail Swagger DTO/API 문서 보강
- [x] Payment service unit test 추가

### Shared/Frontend 계약

- [x] `CreateDeliveryOrderRequest`에 `delivery` 정보 추가
- [x] 배달 주문 item option에 `optionId` 추가
- [x] shared `OrderStatus`에 새 상태 반영
- [x] shared 상태 라벨/색상에 `PENDING_PAYMENT` 반영
- [x] 배달앱 checkout/success payload를 백엔드 DTO와 1차 정렬
- [x] 배달앱 카드 결제 success flow를 서버 검증 기반으로 전환
- [x] 배달앱 카드 결제 fail/abort flow를 서버 실패 기록 기반으로 전환
- [x] 배달앱 TypeScript 타입체크 통과
- [x] 백엔드 Payment service unit test 통과

### 체크리스트 정리

- [x] 루트 체크리스트 최신화
- [x] 배달앱 체크리스트 최신화
- [x] 테이블오더 Front 체크리스트 최신화
- [x] 테이블오더 PWA 체크리스트 최신화
- [x] 관리자 앱 체크리스트 최신화
- [x] 홈페이지 체크리스트 최신화
- [x] Toss POS Plugin 체크리스트 최신화

## 앱별 현재 상태

### Backend

- [x] NestJS API 구조 존재
- [x] Prisma schema 존재
- [x] 메뉴/매장/주문/세션/사용자 모듈 존재
- [x] Toss 메뉴 동기화 API 존재
- [x] POS 연동 API 초안 존재
- [x] 테이블 주문 생성 API 존재
- [x] 배달 주문 생성 API 1차 추가
- [x] 실제 개발 DB에 새 migration 적용 완료
- [x] 배달 현장결제 주문 생성 E2E 확인
- [x] Toss 결제 승인/검증 API 추가
- [x] Toss 결제 실패 기록 API 추가
- [x] Toss 결제 승인/실패 Swagger 문서화
- [x] 결제 금액 검증/성공/실패/중복 승인 단위 테스트 추가
- [ ] 주문 생성 응답 mapper 필요
- [ ] 주문 상세 API 필요
- [ ] 내 주문 목록 API 필요
- [ ] 배달 상태 변경 API 필요
- [ ] 주문 취소/환불 API 필요
- [ ] POS pending orders API를 새 주문 코어에 맞게 확장 필요

### Delivery Customer

- [x] 홈/메뉴/장바구니/주소/결제/주문완료/주문이력 UI 존재
- [x] Toss Payment Widget UI 연결
- [x] 현장결제 주문 payload 1차 정렬
- [x] 카드결제 success 주문 payload 1차 정렬
- [x] 배달 주소/연락처/요청사항 payload 포함
- [x] 옵션 `optionId` payload 포함
- [x] TypeScript 타입체크 통과
- [x] Toss 결제 success flow를 서버 검증 기반으로 변경
- [x] Toss 결제 fail/abort flow를 서버 실패 기록 기반으로 변경
- [ ] 주문 생성 응답을 프론트 타입과 완전히 맞추기
- [ ] 주문 이력/상세를 실제 API로 전환
- [ ] 매장 ID 하드코딩 제거
- [ ] 비로그인 주문/로그인 주문 정책 확정
- [ ] 배달 추적 mock 제거
- [ ] PWA icon/build `location is not defined` 이슈 정리

### Table Order

- [x] QR/매장 URL 기반 구조 존재
- [x] 메뉴/장바구니 UI 존재
- [x] 주문 확인/주문 성공 컴포넌트 존재
- [x] 주문 이력 컴포넌트 초안 존재
- [x] 직원 호출 구조 존재
- [x] Store Context 존재
- [ ] 실제 Store UUID와 tableNumber 확정
- [ ] 첫 주문 API E2E 확인
- [ ] 추가 주문 API E2E 확인
- [ ] 주문 이력/상태 API 전환
- [ ] mock 제거
- [ ] PWA 실기기 테스트

### Brand Website

- [x] 홈/브랜드/메뉴/매장/창업 문의 페이지 존재
- [x] Navbar/Footer 존재
- [x] SEO 기본 파일 존재
- [x] 창업 문의 server action 구조 존재
- [ ] 주문하기 CTA를 배달앱 매장 URL로 연결
- [ ] 메뉴 페이지를 백엔드 API로 전환
- [ ] 매장 페이지를 백엔드 API로 전환
- [ ] 매장별 배달 가능 여부/배달비/최소 주문 금액 표시
- [ ] Kakao Map 실제 연동
- [ ] 창업 문의 저장/관리자 연결

### Admin

- [x] 로그인/초대/초기 설정 구조 존재
- [x] 대시보드/메뉴/주문/테이블 관리 UI 존재
- [x] Realtime 주문 hook 초안 존재
- [x] 주문 영수증 컴포넌트 존재
- [ ] 주문 목록에서 `type`, `source`, `paymentStatus` 표시
- [ ] 주문 상세에서 `Payment` 표시
- [ ] 주문 상세에서 `OrderDelivery` 표시
- [ ] 배달 운영 설정 화면 추가
- [ ] 결제/취소/환불 운영 패널 추가
- [ ] Toss 메뉴 동기화 버튼 연결

### Toss POS Plugin

- [x] Vite 기반 플러그인 구조 존재
- [x] Toss POS SDK 설치
- [x] Realtime/Polling 주문 수신 구조 존재
- [x] 주문 등록 `order.add` 구조 존재
- [x] catalog sync 구조 존재
- [x] build/zip/test 구조 존재
- [ ] 새 주문 코어 기준 POS 전송 조건 확정
- [ ] `PENDING_PAYMENT` 주문 POS 전송 제외
- [ ] 배달 메모/결제수단 POS 메모 매핑
- [ ] `Payment.status`와 `Order.status` 조합별 처리표 작성
- [ ] 실 POS 기기 E2E
- [ ] 실패 재시도/idempotency 보강

## 최우선 개발 순서

1. 실제 Toss test secret key로 카드 결제 성공/실패 E2E 확인
2. Sentry 테스트 이벤트 도착 확인
3. 결제 timeout/만료 배치 또는 정리 API 추가
4. 주문 생성 응답 mapper 정리
5. 주문 목록/상세 API 추가
6. 관리자 주문 상세에 결제/배달 정보 표시
7. 테이블오더 첫 주문/추가 주문 E2E
8. POS pending orders API와 Toss Plugin 매핑 수정
9. 홈페이지 주문 CTA와 Store Context 연결
10. 앱별 빌드/실기기/PWA 검증

## 주요 트레이드오프

### 주문 생성과 결제 순서

- 권장: 주문을 먼저 `PENDING_PAYMENT`로 만들고, 결제 승인 후 `PAID` 또는 `CONFIRMED`로 변경
- 이유: 결제 성공 후 주문 생성 실패 같은 복구 어려운 상황을 줄일 수 있음
- 진행: success는 `PAID`, fail/abort는 `CANCELLED`/`FAILED`로 정리
- 남은 일: 미결제 주문 만료 처리와 idempotency key 재시도 정책 필요

### 주문 상태와 배달 상태

- 권장: `OrderStatus`, `PaymentStatus`, `DeliveryStatus` 분리 유지
- 이유: 조리 상태, 결제 상태, 배달 상태가 섞이면 관리자/POS/고객앱에서 운영 가시성이 떨어짐
- 남은 일: 각 앱 UI에서 상태 매핑 정리

### 홈페이지 주문 처리

- MVP 권장: 홈페이지는 배달앱으로 redirect
- 이후 확장: 홈페이지 직접 주문이 필요하면 `Order.source = HOMEPAGE` 적용

### 비로그인 주문

- MVP 권장: 비로그인 주문 허용 + 전화번호 기반 조회, 마이페이지 기능은 로그인 필수
- 이유: 주문 전환율과 사용자 데이터 관리 사이 균형이 좋음

## 검증 체크리스트

- [x] `apps/backend`: `prisma validate`
- [x] `apps/backend`: `prisma generate`
- [x] `apps/backend`: `tsc --noEmit`
- [x] `apps/backend`: payment service unit test
- [x] `apps/backend`: full unit test suite
- [x] `apps/delivery-customer`: `tsc --noEmit`
- [ ] `apps/table-order`: 타입체크
- [ ] `apps/table-order`: 빌드
- [ ] `apps/admin`: 타입체크
- [ ] `apps/admin`: 빌드
- [ ] `apps/brand-website`: 타입체크
- [ ] `apps/brand-website`: 빌드
- [ ] `apps/toss-pos-plugin`: `pnpm test`
- [ ] `apps/toss-pos-plugin`: `pnpm build`
- [ ] `apps/toss-pos-plugin`: `pnpm zip`
- [x] 실제 개발 DB migration 적용
- [x] 배달 현장결제 주문 생성 E2E
- [ ] 배달 카드결제 주문 생성/승인 E2E
- [ ] 테이블 주문 E2E
- [ ] Toss 결제 E2E
- [ ] Sentry 이벤트 수신 E2E
- [ ] Toss POS Plugin 실기기 E2E

## 상세 체크리스트 위치

- [배달앱](apps/delivery-customer/checkList_delivery.md)
- [테이블오더 Front](apps/table-order/FRONT_CHECKLIST.md)
- [테이블오더 PWA](apps/table-order/PWA_CHECKLIST.md)
- [관리자](apps/admin/CHECKLIST.md)
- [홈페이지](apps/brand-website/checkList_website.md)
- [Toss POS Plugin](apps/toss-pos-plugin/toss-pos-plugin-checkList.md)
