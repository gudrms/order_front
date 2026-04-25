# 배달 앱(delivery-customer) 개발 체크리스트

> 최종 업데이트: 2026-04-25  
> 기준: `apps/delivery-customer`, `packages/shared`, `apps/backend` 코드 확인 및 빌드/타입체크 결과  
> 현재 판정: UI 데모는 가능하지만, 실제 배달 주문 운영 플로우는 아직 미완성

## 현재 요약

- UI 완성도: 약 70%
- 실서비스 완성도: 약 35~45%
- 타입체크: 통과
- 프로덕션 빌드: 정적 페이지 생성까지 성공, 마지막 단계에서 `ReferenceError: location is not defined` 로그 발생
- 가장 큰 리스크: Toss 결제 성공/실패 서버 기록은 연결됐지만 실제 결제 E2E, 주문 이력/상세 API, 미결제 만료 처리가 아직 남아 있음

## 확인된 완료 항목

### 앱 기본 구조

- [x] Next.js App Router 기반 `delivery-customer` 앱 구성
- [x] PWA 설정 기본 구성
- [x] Capacitor 설정 파일 구성
- [x] Sentry 설정 파일 구성
- [x] React Query Provider 구성
- [x] Supabase Auth Context 구성
- [x] `packages/shared`의 API, 타입, 장바구니 store, 메뉴 선택 hook 사용 확인
- [ ] `packages/order-core`는 README상 계획만 있고 실제 구현은 placeholder 상태

### 홈 화면

- [x] 홈 메인 페이지(`/`) 구성
- [x] `HomeHeader` 구성
- [x] `Dashboard` 구성
- [x] `ServiceButtons` 구성
- [x] `QuickMenu` 구성
- [x] `BottomNav` 구성

### 메뉴/장바구니 UI

- [x] 메뉴 페이지(`/menu`) 구성
- [x] 카테고리 탭 UI 구성
- [x] 메뉴 목록 UI 구성
- [x] 메뉴 상세 바텀시트 구성
- [x] 옵션 선택 UI 연결
- [x] 수량 변경 UI 연결
- [x] 장바구니 바텀시트 구성
- [x] 장바구니 수량 변경/삭제 UI 구성
- [x] 최소 주문 금액 15,000원 검증 UI 구성

### 배달 정보 입력

- [x] 배달 주소 입력 바텀시트 구성
- [x] Daum 우편번호 검색 유틸 구성
- [x] 주문자 이름 입력
- [x] 주문자 연락처 입력
- [x] 배달 요청사항 입력
- [x] 연락처 형식 기본 검증

### 결제/주문 화면

- [x] 결제 페이지(`/order/checkout`) 구성
- [x] Toss Payment Widget UI 연결
- [x] 카드 결제 요청 UI 구성
- [x] 현장 결제 주문 버튼 구성
- [x] 결제 성공 페이지(`/order/success`) 구성
- [x] 결제 실패 페이지(`/order/fail`) 구성
- [x] 현장 결제 완료 페이지(`/order/complete`) 구성

### 주문 이력/상세 UI

- [x] 주문 이력 페이지(`/orders`) 구성
- [x] 주문 상세 페이지(`/order-detail`) 구성
- [x] 주문 상태 트래커 UI 구성
- [x] Supabase Realtime 기반 주문 상태 hook 초안 구성

### 로그인/마이페이지 UI

- [x] 로그인 페이지(`/login`) 구성
- [x] Kakao OAuth 호출 코드 구성
- [x] Apple OAuth 호출 코드 구성
- [x] OAuth callback 페이지 구성
- [x] 마이페이지(`/mypage`) 구성
- [x] 주소 관리 페이지 구성
- [x] 주소 추가 페이지 구성
- [x] 찜한 메뉴 페이지 구성

### 네이티브/PWA 유틸

- [x] Camera wrapper 구성
- [x] Geolocation wrapper 구성
- [x] Push Notifications wrapper 구성
- [x] Local Notifications wrapper 구성
- [x] Haptics wrapper 구성
- [x] Network wrapper 구성
- [x] Share wrapper 구성
- [x] Toast wrapper 구성
- [x] Browser wrapper 구성
- [x] Status Bar wrapper 구성
- [x] App lifecycle wrapper 구성
- [x] 네이티브 기능 테스트 페이지(`/test-native`) 구성

## 확인된 부분 완료 항목

### 메뉴 데이터 연동

- [x] 프론트에서 메뉴/카테고리 API 호출 구조 존재
- [x] 백엔드에 메뉴/카테고리 조회 API 존재
- [x] `packages/shared/src/api/endpoints/menu.ts`에서 메뉴 API wrapper 제공
- [ ] 매장 ID가 `store-1`로 하드코딩되어 있음
- [ ] `NEXT_PUBLIC_STORE_ID` 또는 URL 기반 Store Context로 통일 필요
- [ ] 메뉴 검색 UI는 버튼만 있고 실제 검색 기능 없음

### 결제 연동

- [x] Toss Payment Widget 렌더링 구조 존재
- [x] 카드 결제 redirect flow 초안 존재
- [x] Toss 결제 승인 검증 API 추가: `POST /payments/toss/confirm`
- [x] Toss 결제 실패 기록 API 추가: `POST /payments/toss/fail`
- [x] Toss `paymentKey`, `orderId`, `amount`를 서버에서 검증하는 흐름으로 success page 전환
- [x] 카드 결제는 checkout에서 `PENDING_PAYMENT` 주문을 먼저 만들고 success에서 `PAID`로 확정
- [x] Toss fail redirect와 결제창 abort 시 `FAILED`/`CANCELLED` 상태 기록
- [x] 공통 `PaymentsModule`이 결제 상태를 담당하고, 실제 Toss HTTP 호출은 백엔드 `TossApiService`로 분리
- [x] 결제 승인/실패 API Swagger 문서 보강
- [x] 결제 서비스 단위 테스트 추가
- [x] Toss provider order id를 payment `idempotencyKey`로 저장
- [ ] 실제 Toss secret key 환경변수와 결제 테스트키로 E2E 검증 필요
- [ ] 결제 timeout/만료 배치 처리 필요
- [ ] 중복 callback/idempotent create-order 재시도 정책 보강 필요

### 주문 생성

- [x] 프론트 주문 생성 mutation hook 존재
- [x] 백엔드 테이블 주문 생성 API 존재
- [x] `packages/shared/src/types/payment.ts`에 배달 주문 요청 타입(`CreateDeliveryOrderRequest`) 존재
- [x] `packages/shared/src/api/endpoints/order.ts`에 `createOrder` wrapper 존재
- [x] `POST /orders` 배달 주문 생성 엔드포인트 추가
- [x] 백엔드 `CreateDeliveryOrderDto` 추가
- [x] 배달 주문 생성 시 `Order.type = DELIVERY`, `Order.source = DELIVERY_APP` 저장
- [x] 배달 주소/연락처/요청사항 저장용 `OrderDelivery` 모델 추가
- [x] 결제 시도 저장용 `Payment` 모델 추가
- [x] 프론트 payload에 `delivery`와 옵션 `optionId` 포함
- [ ] 주문 생성 응답을 프론트 `OrderResponse`/주문 상세 타입과 완전히 매핑하지 않음
- [x] 카드 결제는 `PENDING_PAYMENT`/`READY` 저장 후 서버 승인 검증으로 `PAID` 확정
- [x] 결제 승인 실패/사용자 중단 시 pending order 실패/취소 기록
- [ ] 결제창 이탈 후 fail callback도 오지 않는 timeout 주문 만료 처리 필요

### 주문 이력/상세

- [x] 주문 이력 UI 존재
- [x] 주문 상세 UI 존재
- [ ] `useOrders`가 아직 `localStorage` mock 사용
- [ ] `packages/shared/src/api/endpoints/order.ts`의 `updateOrderStatus`도 `localStorage` 기반 mock 상태
- [ ] 주문 상세가 백엔드 API가 아니라 Supabase 테이블 직접 조회 사용
- [ ] Supabase 조회 relation 이름과 실제 Prisma 모델 필드명이 어긋날 가능성 있음
- [ ] `as any` 타입 우회 존재
- [ ] API 응답의 `totalAmount/menuPrice`와 프론트 타입의 `totalPrice/unitPrice` 매핑 정리 필요

### Shared/Order Core 정리

- [x] `@order/shared`가 `types`, `constants`, `api`, `cartStore`, `useMenuSelection`, `useOrderStatus`, `supabase`, utils를 export함
- [x] 배달앱 장바구니는 `packages/shared/src/stores/cartStore.ts`를 사용함
- [x] 배달앱 메뉴 옵션 선택은 `packages/shared/src/hooks/useMenuSelection.ts`를 사용함
- [x] 배달앱 주문 상태 구독은 `packages/shared/src/hooks/useOrderStatus.ts`를 사용함
- [ ] `useMenuSelection`의 option group id가 임시값(`temp-id`)이라 옵션 검증/주문 payload와 정합성 보강 필요
- [x] `CreateOrderRequest`의 배달 주문 계약을 백엔드 `POST /orders`와 1차 정렬
- [x] Prisma `OrderStatus`에 `PENDING_PAYMENT`, `PAID`, `PREPARING`, `READY`, `DELIVERING` 추가
- [x] `okposOrderId` 명명은 `tossOrderId`로 정리
- [ ] `Order` 타입은 아직 `totalPrice/unitPrice/tableId` 기준이고 백엔드 Prisma 응답은 `totalAmount/menuPrice/sessionId` 기준이라 mapper 또는 타입 재정의 필요
- [ ] `packages/order-core`는 현재 placeholder라 공통 주문 비즈니스 로직 패키지로 사용 불가

### 사용자 기능

- [x] Supabase Auth Context 존재
- [x] 주소 관리 UI 존재
- [x] 찜하기 UI 존재
- [ ] 백엔드 `users/me/*` API 대부분이 `test-user-id` 사용
- [ ] 프론트 주소/찜 API 호출에 Authorization header 없음
- [ ] 백엔드 Auth Guard 미적용
- [ ] 찜 목록의 주문하기 버튼이 존재하지 않는 `/menu/[id]`로 이동
- [ ] 쿠폰/포인트는 UI만 있고 실제 데이터/정책 없음
- [ ] 회원 정보 수정 없음

### 배달 추적

- [x] 배달 추적 hook 초안 존재
- [x] 상태별 로컬 알림/haptics 처리 초안 존재
- [ ] `/api/delivery/:orderId` mock endpoint 호출 상태
- [ ] 실제 백엔드 배달 추적 API 없음
- [ ] Supabase Realtime 구독 주석 처리 상태
- [ ] 라이더 위치/전화/예상 도착 시간 DB 모델 없음
- [ ] 배달 취소 API 없음
- [ ] 지도 연동 없음

### PWA/빌드

- [x] 타입체크 통과
- [x] 정적 페이지 생성 18개 성공
- [ ] 빌드 마지막 단계에서 `ReferenceError: location is not defined` 로그 확인
- [ ] `public/icons/icon-192x192.png` 경로를 layout에서 참조하지만 실제 public에는 `icon.svg`, `manifest.json`, `sw.js`만 확인됨
- [ ] manifest icon 경로와 실제 asset 정합성 확인 필요
- [ ] Service Worker 캐싱 전략 검증 필요

## 개발 우선순위

### P0: 주문 계약 정상화

- [x] 배달 주문 API 방향 결정: `POST /orders`는 배달/포장/외부 채널, `POST /stores/:storeId/orders/*`는 테이블오더 유지
- [x] `packages/shared`의 `CreateDeliveryOrderRequest`와 백엔드 DTO 1차 정렬
- [x] 프론트 `createOrder` endpoint와 백엔드 root orders endpoint 정렬
- [x] 백엔드 배달 주문 DTO 추가
- [x] 주문 타입 `DELIVERY` 저장
- [x] 배달 주소/연락처/요청사항 저장용 `OrderDelivery` 추가
- [x] 현장 결제 주문 생성 flow가 실제 API payload를 만들도록 수정
- [x] 카드 결제 성공 후 주문 생성 flow가 실제 API payload를 만들도록 수정
- [ ] 주문 생성 응답을 프론트 타입과 맞춤
- [ ] 실제 DB seed/store id 기준으로 E2E 주문 생성 확인 필요

### P1: 결제 안정화

- [x] `Payment` 모델 추가
- [x] `PaymentStatus` 추가
- [x] Toss 결제 승인/검증 서버 API 추가
- [x] 클라이언트 success page에서 직접 주문 생성하지 않도록 정리
- [x] 주문 생성 후 결제 확정 방식으로 통일
- [x] 중복 callback 방지용 idempotency key 저장
- [x] 결제 실패/취소 상태 기록
- [x] 결제 금액 변조 방지 검증
- [x] 결제 성공/실패 핵심 단위 테스트
- [ ] 결제 timeout/만료 상태 처리

### P1: 주문 이력/상세 API 전환

- [ ] `useOrders`를 백엔드 API로 교체
- [ ] 내 주문 목록 API 추가 또는 기존 주문 목록 API 확장
- [ ] 주문 상세 API 추가
- [ ] 프론트 Order 타입과 백엔드 응답 mapper 정리
- [ ] 주문 상세의 Supabase 직접 조회 제거
- [ ] 주문 상태 tracker가 실제 주문 상태 변경을 구독하도록 정리

### P1: 인증/사용자 데이터 연결

- [ ] 프론트 API client에 Supabase access token 주입
- [ ] 백엔드 `users/me/*`에 SupabaseGuard 적용
- [ ] `test-user-id` 제거
- [ ] 주소 조회/추가/삭제를 실제 사용자 기준으로 동작하게 수정
- [ ] 찜 조회/추가/삭제를 실제 사용자 기준으로 동작하게 수정
- [ ] 비로그인 사용자의 주문 가능 정책 결정

### P2: 매장 선택/Store Context

- [ ] `store-1` 하드코딩 제거
- [ ] `NEXT_PUBLIC_STORE_ID` 기본값 사용
- [ ] URL 기반 매장 식별(`/tacomolly/gimpo` 등)을 배달앱에도 적용할지 결정
- [ ] 마지막 선택 매장 저장 정책 결정
- [ ] 매장 영업 상태/최소 주문 금액/배달 가능 여부 API 연동

### P2: 배달 추적 실제화

- [ ] 배달 상태 모델 확정
- [ ] 주문 상태와 배달 상태를 분리할지 결정
- [ ] 예상 조리/배달 시간 저장
- [ ] 라이더 정보 저장 모델 결정
- [ ] Realtime 구독 활성화
- [ ] 상태 변경 시 로컬/푸시 알림 연결
- [ ] 지도 연동 여부 결정

### P2: UX/품질 개선

- [ ] 메뉴 검색 기능 구현
- [ ] 찜 목록 주문하기 동선 수정
- [ ] alert/confirm을 앱 UI로 교체
- [ ] 장바구니 추가 toast 구현
- [ ] 로딩/에러/빈 상태 문구와 UI 정리
- [ ] 깨진 문구/인코딩 출력 점검
- [ ] shared/order-core 역할 재정리: 지금은 shared에 상태/비즈니스 로직이 섞여 있음
- [ ] PWA 아이콘 asset 정리
- [ ] 빌드 `location is not defined` 원인 제거

### P3: 네이티브 고도화

- [ ] Android 프로젝트 생성/동기화 상태 재검증
- [ ] iOS 프로젝트 생성
- [ ] Firebase FCM 설정
- [ ] Android FCM 연동
- [ ] iOS APNS 연동
- [ ] Deep Link 설정
- [ ] App Links/Universal Links 설정
- [ ] 스토어 배포용 splash/icon/권한 문구 정리

## 선택이 필요한 트레이드오프

### 1. 배달 주문 API 설계

- 선택 A: 기존 `orders` API를 확장해서 `type: DELIVERY`를 받게 만든다.
- 장점: 주문 도메인 하나로 관리되어 admin/POS 연동이 단순해짐.
- 단점: 테이블 주문 전제(`tableNumber`, `session`)를 분리하는 리팩터링이 필요함.

- 선택 B: `/delivery/orders` 또는 `/stores/:storeId/delivery-orders` API를 새로 만든다.
- 장점: 빠르게 배달 플로우를 만들 수 있고 테이블 주문 영향이 적음.
- 단점: 나중에 admin/POS/order history에서 주문 타입별 중복 로직이 생길 수 있음.

권장: 선택 A. 이미 Prisma `Order.type`에 `DELIVERY`가 있으므로 기존 주문 모델을 확장하는 편이 장기적으로 깔끔함.

### 2. 결제/주문 생성 순서

- 선택 A: 결제 성공 후 주문 생성
- 장점: 결제된 주문만 DB에 남음.
- 단점: 결제 성공 후 주문 생성 실패 시 수동 복구/환불 처리가 필요함.

- 선택 B: 주문을 `PENDING_PAYMENT`로 먼저 만들고 결제 승인 후 `PAID/CONFIRMED`로 변경
- 장점: 결제 callback 유실/재시도/idempotency 관리가 쉬움.
- 단점: 주문 상태 enum과 만료 처리 로직이 추가됨.

권장: 선택 B. 실서비스 결제 안정성은 이쪽이 더 좋음.

### 3. 비로그인 주문 허용 여부

- 선택 A: 비로그인 주문 허용
- 장점: 주문 전환율이 좋음.
- 단점: 주문 이력/주소/찜과 연결이 약하고 전화번호 기반 조회가 필요함.

- 선택 B: 로그인 필수
- 장점: 사용자 데이터 관리가 단순함.
- 단점: 첫 주문 진입 장벽이 생김.

권장: MVP는 비로그인 주문 허용 + 전화번호 기반 주문 조회, 마이페이지 기능은 로그인 필수.

### 4. 주문 상태와 배달 상태 분리

- 선택 A: 주문 상태에 `DELIVERING` 등 배달 상태까지 포함
- 장점: 구현이 빠름.
- 단점: 조리/배달/정산 상태가 섞임.

- 선택 B: `OrderStatus`와 `DeliveryStatus`를 분리
- 장점: 확장성과 운영 가시성이 좋음.
- 단점: 모델과 UI 매핑이 늘어남.

권장: MVP는 주문 상태 확장으로 시작하고, 라이더/지도/배차가 들어가면 분리.

## 다음 개발 순서

1. 실제 Toss test secret key로 카드 결제 성공/실패 E2E 확인
2. 결제 timeout/만료 pending order 정리
3. 주문 생성 응답 mapper와 프론트 주문 상세 타입 정리
4. 주문 이력/상세를 실제 API로 전환
5. 사용자 주소/찜 API에 인증 연결
7. 매장 ID 하드코딩 제거
8. 배달 추적 mock 제거 및 Realtime 연결
9. UX 오류 처리와 검색/찜 동선 정리
10. PWA asset/build 경고 정리

## 검증 기록

- [x] `cmd /c .\node_modules\.bin\tsc.cmd --noEmit` 실행: 통과
- [x] 백엔드 `cmd /c .\node_modules\.bin\tsc.cmd --noEmit` 실행: 통과
- [x] 백엔드 `vitest run src/modules/payments/payments.service.spec.ts` 실행: 6개 통과
- [x] 백엔드 `vitest run` 실행: 3개 파일, 14개 테스트 통과
- [x] 개발 DB `prisma migrate deploy` 실행: migration 7개 기준 up to date
- [x] 개발 DB 현장결제 배달 주문 생성 E2E: `DELIVERY_APP`/`CASH`/`OrderDelivery` 생성 확인
- [x] `cmd /c .\node_modules\.bin\next.cmd build` 실행: 정적 페이지 생성 성공
- [ ] 빌드 후 `ReferenceError: location is not defined` 로그 해결 필요
- [x] 현장결제 주문 생성 E2E 검증 완료
- [ ] 카드결제 주문 생성/승인 E2E 검증 필요
- [ ] Toss 결제 성공/실패/timeout E2E 검증 필요
- [ ] Sentry 테스트 이벤트 수신 검증 필요
- [ ] 로그인 후 주소/찜 E2E 검증 필요
- [ ] PWA 설치/아이콘 검증 필요

## 참고 파일

- `packages/shared/src/index.ts`
- `apps/delivery-customer/src/app/order/checkout/page.tsx`
- `apps/delivery-customer/src/app/order/success/page.tsx`
- `apps/delivery-customer/src/hooks/queries/useOrders.ts`
- `apps/delivery-customer/src/hooks/queries/useMenus.ts`
- `packages/shared/src/api/endpoints/order.ts`
- `packages/shared/src/stores/cartStore.ts`
- `packages/shared/src/hooks/useMenuSelection.ts`
- `packages/shared/src/hooks/useOrderStatus.ts`
- `packages/order-core/src/index.ts`
- `packages/shared/src/types/payment.ts`
- `apps/backend/src/modules/orders/orders.controller.ts`
- `apps/backend/src/modules/orders/dto/create-order.dto.ts`
- `apps/backend/src/modules/users/users.controller.ts`
- `apps/backend/prisma/schema.prisma`
