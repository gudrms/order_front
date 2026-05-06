# Taco Mono 루트 체크리스트
마지막 업데이트: 2026-05-03 (런칭 준비도 감사 — Launch blocker 5개, High risk 5개 식별)

## 🚨 1차 런칭 Blocker (admin / brand-website / delivery-customer + backend)

런칭 직전 반드시 해소해야 하는 항목. 도메인 코어와 운영 인프라는 견고하나, 트리거·대시보드·dead code·CORS·env 설정에 결함 있음.

- [x] **[P0] MQ consumer 자동 트리거 부재** (2026-05-04): Vercel Pro 업그레이드 대신 **GitHub Actions**(`.github/workflows/backend-cron.yml`)를 사용하여 무료로 5분 주기로 `POST /queue/process-once` 등을 호출하도록 구축 완료.
- [x] **[P0] Admin 대시보드 하드코딩 stats 제거** (2026-05-04): 가짜 숫자(45건/₩842,000/3건/2종)를 `—` placeholder로 전환 + "통계 데이터 연동 준비 중" 안내 배너 추가. 운영자에게 가짜 숫자 노출 차단. 후속 작업: 매장별 일일 통계 API 구현 (별도 항목)
- [x] **[P0] delivery-customer 결제 dead code 삭제** (2026-05-04): `apps/delivery-customer/src/features/payment/` 디렉토리 통째 삭제 (`payment.ts` + `types.ts`). 어디서도 import 안 되던 dead code 확인 후 제거. tsc 통과.
- [x] **[P0] CORS 다중 origin 화이트리스트** (2026-05-04): `apps/backend/src/main.ts` 운영 기본값에 tacomole.kr 5개 도메인(`tacomole.kr`, `www`, `admin`, `delivery`, `order`) + Capacitor scheme(`capacitor://localhost`, `http://localhost`, `https://localhost`) 자동 허용. `FRONTEND_URLS` 콤마 구분 환경변수로 추가 origin override 가능. 기존 `FRONTEND_URL` 단일 값 호환 유지
- [x] **[P0] 백엔드 `.env.example` 정리** (2026-05-04): 중복 복붙 제거 + `INTERNAL_JOB_SECRET`, `FRONTEND_URLS` 추가, 섹션별 주석 정리

## ⚠️ High risk (런칭 후 곧 터질 가능성)

- [ ] 실 Toss 카드결제 자동화 E2E 도입 (`payments-e2e.spec.ts`는 서비스 레이어 mock만)
- [ ] 푸시 알림 구현: **Firebase Cloud Messaging(FCM) 기반 잠금화면 푸시 연동**
  - [x] 백엔드: 토큰 DB 저장, Firebase Admin 발송 API, 큐 연동 완료 (2026-05-04)
  - [x] 배달앱(고객): Capacitor 푸시 알림 프론트 완성 (2026-05-05). `packages/shared/api/endpoints/devices.ts` 추가. `hooks/usePushNotifications.ts` — 권한 요청/토큰 등록/포어그라운드 표시/탭 라우팅. `AuthContext.signOut` 로그아웃 시 토큰 삭제. tsc 통과. 실기기 FCM 토큰 발급 E2E 검증 필요.
  - [x] 관리자웹(사장): PWA Service Worker 기반 웹 푸시 연동, `ADMIN_WEB` 토큰 백엔드 등록/로그아웃 삭제, 포그라운드 표시 연결 (2026-05-05). 운영 Firebase env/VAPID 입력 후 브라우저 수신 E2E 필요.
- [ ] Throttler in-memory store가 Vercel 다중 인스턴스에서 무력화 → Redis store 도입 검토
- [x] `useDeliveryTracking.ts` mock 데이터 처리 (2026-05-04): import 사용처 0건 확인 후 `features/delivery-tracking/` 디렉토리 통째 삭제 (payment dead code와 동일 패턴). 실 배달 추적은 `app/orders/[id]/OrderDetailClient.tsx` + `@order/shared` `DeliveryStatus`로 이미 정상 동작
- [x] `apps/delivery-customer/src/components/menu/MenuDetail.tsx` menuId 미연결 (2026-05-04): import 사용처 0건 확인 후 dead code 삭제. 실 메뉴 상세는 `MenuDetailBottomSheet.tsx`에서 `useMenuDetail` hook + Zustand `useUIStore.selectedMenuId`로 정상 동작
- [x] Capacitor `allowMixedContent` 운영 빌드 차단 (2026-05-04): 기존 `cleartext` 분기 패턴(`serverUrl?.startsWith('http://')`)을 `allowMixedContent`에도 적용. 운영(HTTPS / unset)에서 false, 로컬 HTTP dev 서버에서만 true. MITM 공격면 감소
- [x] AndroidManifest App Links host 정정 (2026-05-04): `delivery.taco.com` → `delivery.tacomole.kr` (manifest 1건 + 코드 주석 useDeepLink/app.ts 3건 + CAPACITOR_DEEPLINK_TEST.md 4건). 코드 로직은 host 무관(`parsed.pathname` 사용)이라 동작 영향 없음
- [x] **후속**: `apps/delivery-customer/public/.well-known/assetlinks.json` 파일 생성 + Next.js headers 설정 완료 (2026-05-05). SHA-256 지문 placeholder(`AA:BB:...`) — 실 키스토어 생성 후 교체 필요. Content-Type: application/json 헤더 자동 적용.
- [x] **후속**: `apps/delivery-customer/public/.well-known/apple-app-site-association` 파일 생성 완료 (2026-05-05). TEAM_ID placeholder — Xcode 팀 ID 확인 후 교체 필요. Associated Domains capability는 Xcode에서 별도 추가.

## 🧱 Tech debt (누적 시 문제)

- [ ] 프론트 자동화 테스트 0건 (admin/brand-website/delivery-customer) — Playwright 도입
- [x] `apps/backend/src/modules/orders/orders.controller.ts` 인라인 OrderStatus enum 제거 (Prisma enum 사용) (2026-05-05)
- [x] 백엔드 단일 serverless function 라우팅 개선 (2026-05-05): `/api/v1/queue/*`를 `src/queue.ts` 전용 Vercel function으로 분리, 일반 API 30s/queue 60s timeout 설정.
- [ ] delivery-customer console.log 56개 정리 (Sentry treeshake 의존)
- [ ] `apps/admin/CHECKLIST.md`, `apps/delivery-customer/checkList_delivery.md` 등 분기된 미완료 항목 통합

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
- [x] 매장별 운영 모드(Toss 포스 모드 / 일반 관리자 모드) 분리 정책 확정: 둘 다 지원, 매장이 등록 시 운영 모드 선택. 일반 모드는 백엔드 DB가 메뉴 SSOT, Toss 모드는 POS가 SSOT

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
- [~] ~~홈페이지 직접 주문 시 `Order.source = HOMEPAGE` 적용~~ → **정책 전환(2026-05-02)**: 홈페이지 직접 주문 폐기, 배달앱 리다이렉트로 단일화. `HOMEPAGE` source/공개 주문 API는 사용 중단
- [~] ~~홈페이지 직접 주문 후처리 (MQ → POS/알림)~~ → 위 정책 전환에 따라 적용 대상 없음
- [ ] Toss SDK/POS 직접 주문 시 채널 정책 확정
- [~] ~~관리자 수기 주문 시 `Order.source = ADMIN` 적용~~ → **영역 밖**: 수기 주문은 해당 매장 POS에서 처리 (백엔드/관리자 웹은 미구현)

## 백엔드 완료

- [x] Prisma schema validate 통과
- [x] Prisma client generate 통과
- [x] 백엔드 TypeScript 타입체크 통과
- [x] 최신 queue/POS migration 개발 DB 적용 완료
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
- [x] 관리자 Toss 결제 취소/환불 API `POST /payments/orders/:orderId/toss/cancel`
- [x] 배달 주문 목록 API 추가
- [x] 주문 상세 API 추가
- [x] 결제 timeout/pending 만료 처리 추가
- [x] 배달 주문 생성/목록/상세 Supabase JWT 인증과 사용자 소유권 검증 추가
- [x] 인증 사용자 동기화 API `POST /auth/sync` 추가
- [x] 결제 승인 전 고객 주문 취소 API `PATCH /orders/:orderId/cancel` 추가
- [x] 배달 상태 변경 API `PATCH /stores/:storeId/orders/:orderId/delivery-status` 추가
- [x] 주문 서비스 단위 테스트에 고객 취소 정책 추가
- [x] 주문 서비스 단위 테스트에 배달 상태 변경 정책 추가
- [x] 결제 완료 후 관리자 환불/취소 API 추가
- [x] POS pending orders API를 새 정책 기준으로 확장
- [x] 백엔드 기술 스펙 문서 분리: `apps/backend/BACKEND_TECH_SPEC.md`
- [x] MQ 기술 스펙 문서 분리: `apps/backend/MQ_TECH_SPEC.md`
- [x] MQ 도입 설계 확정: Supabase Queues/`pgmq` 우선, backend worker에서 POS 전송/알림/재시도 처리
- [x] MQ 1차 적용: `order.paid`, `payment.refunded`, `pos.send_order`, `notification.send` 이벤트 정의
- [x] MQ 안전장치: idempotency key, retry/backoff, 실패 상태 기록, 관리자 재처리 흐름 정의
- [x] POS 전송 worker가 queue consumer에서 실제 `ResilientPosService.sendOrder()` 호출
- [x] Queue/POS 운영 상태 migration 추가: `pgmq`, `backend_events`, `QueueEventLog`, `NotificationLog`, `posSync*`
- [x] 결제 만료/불일치 복구 운영 endpoint에 내부 secret 검증 추가
- [x] 실제 운영 DB에 최신 queue/POS migration 적용
- [x] 알림 provider 연결로 `notification.send` 실제 발송 처리
- [x] Toss 승인 성공 후 로컬 DB 저장 실패 시 즉시 보상 취소/환불 처리
- [x] `delivery.status_changed` 이벤트 발행/consumer 처리
- [x] `QueueModule`을 `AppModule`에 등록 (MQ 전체 프로덕션 동작 보장)
- [x] Toss 카드결제 E2E 통합 테스트 추가: 성공/실패/보상취소/전액환불/부분환불/타임아웃 6개 시나리오
- [x] 쿠폰 시스템 구현: `Coupon` / `UserCoupon` Prisma 모델 + migration
- [x] 쿠폰 모듈: `CouponsService` / `CouponsController` / `UserCouponsController` (PERCENTAGE·FIXED_AMOUNT, 프로모코드 등록, 관리자 발급)
- [x] 쿠폰 적용 연동: `CreateDeliveryOrderDto.userCouponId`, `OrdersService.createDeliveryOrder` 내 할인 계산 + `markAsUsed` 호출
- [x] 쿠폰 단위 테스트 추가: 15 tests (할인 계산, 만료/사용/한도 검증, 정률cap, 정액min 등)
- [x] 배달앱 쿠폰 UI: shared 쿠폰 타입/API, 체크아웃 쿠폰 선택 바텀시트, /mypage/coupons 페이지, 마이페이지 쿠폰 개수 실시간 표시

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
- [x] 주문상세에서 배달 상태와 라이더 메모 표시
- [x] 주문상세를 `/orders/[id]` 동적 라우트로 전환
- [x] `output: 'export'` 제거 후 Next 서버/Capacitor 원격 WebView 기준으로 빌드 구조 정리
- [x] Toss 카드결제 성공/실패/보상취소/환불/타임아웃 E2E 통합 테스트 (백엔드 서비스 레이어)
- [x] 주문내역 카드에 취소/환불 상태 배지 표시
- [x] 주소 조회/추가/삭제를 실제 사용자 기준으로 동작
- [x] 찜 조회/추가/삭제를 실제 사용자 기준으로 동작
- [x] 쿠폰 데이터 정책 결정 및 구현 (PERCENTAGE·FIXED_AMOUNT, 1장/주문, 30일 기본 만료, 5000원 정률 상한)
- [x] PWA 빌드/설치 검증 — 아이콘 8종 생성, manifest 정합성 수정, layout.tsx 메타 완비, next build 19/19 페이지 정상

## 단계별 남은 일

- [ ] **[작업 우선순위]** 진행 순서는 백엔드 ➡️ 배달앱 ➡️ 관리자 ➡️ 홈페이지로 고정한다.
- [x] **[운영 인프라]** Vercel Shared 환경변수(All-in-one) 셋업 및 오버라이딩 원리 정리 (2026-05-04)
- [ ] **[인프라 고도화]** 추후 개발(Dev)과 운영(Prod) 환경을 물리적으로 분리하여 안전한 테스트 및 배포 파이프라인 구축
- [ ] **[MVP 론칭 전략]** 초기 오픈은 '배달앱(고객) ➡️ 관리자웹(점주) ➡️ 영수증 출력' 구조로 한정 (Toss POS 및 테이블오더 연동은 Phase 2로 연기)
- [ ] **[관리자 아키텍처]** 웹 브라우저의 한계(백그라운드 스로틀링, 자동재생 차단, 인쇄 팝업) 극복을 위해 Admin 웹을 Electron으로 랩핑하여 PC 전용 수신 프로그램으로 구축
- [ ] **[배달앱 배포 전략]** 스토어 최적화 및 핫 푸시 업데이트를 위해 Capacitor를 활용하여 구글 플레이스토어 및 애플 앱스토어 배포 파이프라인 구축
- [x] 배달앱: Capacitor 원격 WebView 기준선 설정 (`CAPACITOR_SERVER_URL`, `webDir: 'public'`)
- [x] 배달앱: Capacitor android/ios 네이티브 프로젝트 생성 + deeplink 훅 구현 (`taco://`, App Links)
- [x] 관리자: 매장 등록/운영 설정 화면을 백엔드 API에 연결
- [x] 관리자: 주문 목록에서 `type`, `source`, `paymentStatus`, 배달 상태 표시
- [x] 관리자: 배달 상태 변경 버튼/운영 화면 구현
- [x] 관리자: 결제 완료 주문 전액 취소/부분 환불 버튼 구현
- [x] 관리자: MQ 운영 화면에서 POS/알림 실패 조회와 수동 재시도 연결
- [x] **[P1]** 운영 모드 분기 코드 구현: `MenuManagementMode` enum(`TOSS_POS` | `ADMIN_DIRECT`) — 메뉴 SSOT 분기(menus.service), POS 워커 분기(queue-consumer: ADMIN_DIRECT skip + SKIPPED 처리), 관리자 매장 등록 운영 모드 선택 UI, ADMIN_DIRECT에서만 메뉴 CRUD 허용 — 전부 구현 완료
- [x] 테이블오더: 실제 Store UUID/tableNumber 연결과 첫 주문/추가 주문 API 분기 연결
- [ ] 테이블오더: 첫 주문/추가 주문 브라우저·백엔드 E2E
- [x] 테이블오더: 주문 상태 API 연결 (current-session polling + 상태 배지)
- [x] 테이블오더: 직원 호출 실제 API 연결 (`stores/:storeId/tables/:tableNumber/calls`)
- [x] 테이블오더: 런타임 mock 데이터/MSW 제거
- [x] 홈페이지: 매장/메뉴 API 연결 (GET /stores 퍼블릭 엔드포인트, 배달 정보 표시, 카테고리/메뉴 fetch)
- [x] 홈페이지: 직접 주문 정책 확정 — **폐기, 배달앱 리다이렉트로 단일화** (2026-05-02)
- [x] 홈페이지: Hero/매장 카드 CTA → `OrderCTAButton` (배달앱 URL + 모바일 `taco://` 딥링크 fallback)
- [x] 홈페이지: `/order`, `/order/success`, `/order/fail` 라우트 제거
- [x] 백엔드: `POST /orders/homepage` 엔드포인트 + `CreateDeliveryOrderDto.source` HOMEPAGE 분기 제거
- [ ] Toss SDK/POS 앱: 실기기 E2E와 Claude 진행분 기준 최종 충돌 점검
- [x] 공통: Swagger 명세 보강 (누락 태그 11개 등록, users/menus 어드민 엔드포인트 ApiOperation 완비, 설명 최신화)
- [x] 공통: 주요 API 테스트 코드 보강 (17 files / 127 tests — stores/menus 어드민 CRUD, Sentry transport, AppController 추가)

## 검증 기록

- [x] `apps/backend`: `tsc --noEmit`
- [x] `apps/backend`: 최신 전체 `vitest run` **18 files / 142 tests** 통과 (2026-05-01)
- [x] `apps/backend`: `vitest run src/modules/orders/orders.service.spec.ts` 21 tests 통과 (`HOMEPAGE` 주문 출처 지원 포함)
- [x] `apps/backend`: `vitest run src/modules/payments/payments.service.spec.ts` 12 tests 통과
- [x] `apps/backend`: `vitest run src/modules/payments/payments-e2e.spec.ts` 7 tests 통과 (Toss E2E 통합)
- [x] `apps/admin`: `tsc --noEmit`
- [x] `apps/admin`: `pnpm --filter admin build` 통과 및 `/operations` 라우트 생성 확인
- [x] `apps/admin`: `/operations` 미인증 접근 시 로그인 화면 리다이렉트 브라우저 확인
- [x] `apps/delivery-customer`: `tsc --noEmit`
- [x] `apps/delivery-customer`: `next build` 통과 및 `/orders/[id]` 동적 라우트 확인
- [x] `packages/shared`: `tsc --noEmit`
- [x] 개발 DB `prisma migrate deploy`: 최신 queue/POS migration 적용 완료
- [x] 개발 DB `prisma migrate status`: 최신 queue/POS migration 적용 후 최신 상태 확인
- [x] 배달 카드결제 주문 생성/승인/실패/환불 E2E 통합 테스트 통과
- [x] Toss 결제 성공/실패/timeout/보상취소 E2E 통합 테스트 통과
- [x] Sentry 이벤트 수신 E2E (SentryTransport unit test 완비, GET /sentry/error 엔드포인트 검증 — Sentry 대시보드 수동 확인 필요)
- [ ] Toss SDK/POS 실제 기기 E2E

## 다음 개발 순서

1. 백엔드: Swagger 명세 보강, 주요 API 테스트 코드 보강, 최신 전체 테스트 상태 재확인
2. 배달앱: Toss 테스트 카드결제 성공/실패/환불 E2E와 결제 후 POS/알림 중복 노출 검증
3. 배달앱: Capacitor 원격 WebView 실기기 실행, `/orders/[id]` 딥링크, PWA/Sentry 검증
4. 관리자: MQ 운영 화면 POS/알림 실패 조회 및 재시도 브라우저 E2E
5. 테이블오더: 첫 주문/추가 주문 브라우저 E2E, 직원 호출 Realtime/관리자 수신 화면 연결
6. 홈페이지: `/order` 라우트/결제 페이지 제거 + Hero/매장 CTA를 배달앱 URL로 전환 (모바일 딥링크 fallback 포함), 백엔드 공개 HOMEPAGE 주문 API 비활성화

## 체크리스트 위치

- [배달앱](apps/delivery-customer/checkList_delivery.md)
- [백엔드](apps/backend/BACKEND_CHECKLIST.md)
- [테이블오더 Front](apps/table-order/FRONT_CHECKLIST.md)
- [테이블오더 PWA](apps/table-order/PWA_CHECKLIST.md)
- [관리자](apps/admin/CHECKLIST.md)
- [홈페이지](apps/brand-website/checkList_website.md)
- [Toss SDK/POS 앱](apps/toss-pos-plugin/toss-pos-plugin-checkList.md)

## 최신 동기화 (2026-05-02)

- [x] 테이블오더 실제 Store UUID/tableNumber 진입, 첫 주문/추가 주문 API 분기, 주문 상태 polling, 직원 호출 API 연결 완료
- [x] 테이블오더 런타임 mock/MSW/하드코딩 fallback 제거 완료 및 `tsc --noEmit`, `next build` 통과
- [x] 관리자 MQ 운영 화면 연결 및 실패 재시도 흐름 구현 완료
- [x] 홈페이지 매장/메뉴 조회는 실제 API 기반으로 전환 완료
- [x] **정책 전환**: 홈페이지 직접 주문 폐기, 배달앱 리다이렉트로 단일화 — 코드 롤백 완료 (a1d6366/4e00a74 부분 무효화)
- [x] 홈페이지 `/order` 라우트/결제 페이지 제거 + Hero/매장 CTA를 배달앱 URL로 전환 (`OrderCTAButton` + 모바일 `taco://` 딥링크 fallback)
- [x] 백엔드 공개 HOMEPAGE 주문 API 제거 (`POST /orders/homepage`, DTO source 필드, HOMEPAGE 분기)

## 최신 동기화 (2026-05-03) — 런칭 준비도 감사

- [x] 코드 직접 점검 기반 평가: 백엔드 도메인 코어/MQ/Sentry/인증은 상위권, **트리거·dashboard·dead code·CORS·env 5개 결함**으로 즉시 오픈 비추천
- [x] Launch blocker 5개 / High risk 5개 / Tech debt 5개 / Strength 5개 식별 (위 섹션)
- [x] 현실적 런칭 시나리오: Week 1 blocker 1~3,5 + closed beta → Week 2 blocker 4 + 실 카드 E2E → Week 3 일반 오픈
- [x] 가장 위험한 착시: 체크리스트 `[x]` 비율 높음 vs 실 안정성(자동 cron 0 / 실 결제 E2E 0 / 프론트 자동화 0)
- [ ] 본 평가 항목들이 각 앱 체크리스트에 반영되었는지 1주일 내 재확인
- [ ] 테이블오더 첫 주문/추가 주문 브라우저-백엔드 E2E
- [x] 관리자 MQ 운영 화면 브라우저 E2E (2026-05-06): `e2e/admin/operations.spec.ts` 추가. Supabase 세션/API route mock 기반으로 `/operations` 실패 목록 렌더링, POS 재시도, 알림 재시도 요청 검증. `playwright --list` 확인, admin tsc 통과. 로컬 실제 실행은 Playwright Chromium 설치 필요.
- [ ] Toss SDK/POS 실제 기기 E2E

---

## 📋 전체 잔여 작업 마스터 목록 (2026-05-05 기준)

> 코드 작업과 비코드 작업(인프라·실기기·정책) 모두 포함.
> 완료 시 `[ ]` → `[x]` 로 변경하고 날짜 기재.

---

### 🔴 A. 런칭 직결 코드 작업

#### A-1. 관리자 대시보드 통계 API 연결
- [x] 백엔드: `GET /stores/:storeId/stats/daily` 구현 (2026-05-05): Prisma aggregate로 오늘 주문 수(취소/미결제 제외), 오늘 매출(approvedAmount 합산), 처리 중인 주문 수(PAID~DELIVERING), 품절 활성 메뉴 수 반환. SupabaseGuard + assertCanManageStore 소유권 검증. tsc 통과.
- [x] 관리자 대시보드 4개 카드를 실제 API useQuery로 연결 (2026-05-05): 60초 자동 갱신, 로딩 중 `...` 표시, 매장 미선택 시 안내 배너. `—` placeholder 안내 배너 제거. tsc 통과.

#### A-2. 관리자 직원 호출 수신 화면 연결
- [x] 백엔드 `GET /stores/:storeId/calls` + `PATCH /stores/:storeId/calls/:callId/complete` 추가 (2026-05-05). SupabaseGuard + 소유권 검증.
- [x] `useStaffCalls` 훅: Realtime INSERT 구독 + 30초 폴링 + `admin:new-staff-call` 이벤트 발행 (2026-05-05)
- [x] `StaffCallNotification`: 토스트 알림 (테이블 번호 + 호출 유형 + 2회 알림음) 8초 자동 닫기 (2026-05-05)
- [x] `/calls` 페이지: 대기 호출 카드 목록 + 처리 완료 버튼 (2026-05-05)
- [x] 사이드바 '직원 호출' 메뉴 추가, DashboardLayout에 전역 Realtime 구독 마운트. tsc 통과.

#### A-3. 관리자 웹(사장) FCM 웹 푸시 연동
- [x] `apps/admin`에 Service Worker 등록 (API Route `/api/firebase-sw`로 동적 제공 — 환경변수 주입) (2026-05-05)
- [x] Firebase SDK 초기화 + `getToken()` 호출 (`lib/firebase.ts`, `hooks/useWebPush.ts`) (2026-05-05)
- [x] 로그인 후 `POST /api/v1/devices` 토큰 전송 (deviceType: 'WEB') (2026-05-05)
- [x] 로그아웃 시 `DELETE /api/v1/devices/:token` (`AuthContext.signOut` 연동) (2026-05-05)
- [x] 백그라운드 메시지 수신 처리 (SW 핸들러 `onBackgroundMessage` + notificationclick) (2026-05-05)

#### A-4. 테이블오더 오류 UI 정리
- [x] 주문 실패(재고 부족/매장 비활성) 오류 화면 구현 (2026-05-05): `OrderConfirmModal` — `parseOrderError()`로 `ApiClientError` 메시지 파싱 → 품절/비활성/서버오류 한국어 안내. ⚠️/❌ 구분 UI.
- [x] 테이블 없음 오류 → "QR을 다시 스캔해주세요" 안내 화면 (2026-05-05): `[tableId]/page.tsx` 유효하지 않은 tableId 오류 풀스크린 UI. `OrderConfirmModal` `'Table not found'` 한국어 처리.
- [x] 예약 테이블 차단 오류 → "이 테이블은 예약석입니다" 안내 화면 (2026-05-05): `OrderConfirmModal` `'Table is reserved'` → 한국어 안내.
- [x] POS 후처리 실패가 고객 주문 완료 화면을 막지 않는지 에러 핸들링 검토 (2026-05-05): `orders.service.ts` `createOrder` 확인 — 테이블 주문 생성 시 POS 큐 호출 없음, 비동기 분리 확인. 안전.

---

### 🟡 B. 기술 부채 코드 작업

#### B-1. 백엔드 인라인 enum 제거
- [x] `apps/backend/src/modules/orders/orders.controller.ts:11-22` 인라인 `OrderStatus` 상수 제거 (2026-05-05)
- [x] `@prisma/client`의 `OrderStatus` enum 직접 import로 교체 (2026-05-05)
- [x] `tsc --noEmit` 통과 (2026-05-05)

#### B-2. DB schema OrderChannel HOMEPAGE 값 정리
- [x] `prisma/schema.prisma` `OrderChannel` enum에서 `HOMEPAGE` 값 제거 (2026-05-05)
- [x] migration 파일 생성 (`20260505000000_remove_homepage_order_channel`) — 운영 DB 적용 시 HOMEPAGE source 주문 없음 확인 후 `prisma migrate deploy` 실행 필요 (2026-05-05)
- [x] `createHomepageOrder` 함수 제거 (packages/shared, api/index.ts) (2026-05-05)
- [x] `packages/shared/src/types/payment.ts` `OrderChannel` 타입에서 HOMEPAGE 제거 (2026-05-05)
- [x] `apps/admin` orders 페이지 sourceLabel에서 HOMEPAGE 제거 (2026-05-05)
- [x] `prisma generate` 후 tsc 통과 (2026-05-05)
- [ ] 운영 DB `prisma migrate deploy` 적용 (실기기/운영 환경 작업)

#### B-3. 배달앱 console.log 정리 (56개 → 0개)
- [x] 잔여 6개 console.log 전수 제거/변환 (2026-05-05): MenuDetailBottomSheet 1, PWAInstaller 4개 제거/error 변환, toast.ts 1개 무음 처리
- [x] `next.config.ts` `compiler.removeConsole` 프로덕션 빌드 적용 (error/warn 제외) (2026-05-05)
- [x] tsc 통과 (2026-05-05)

#### B-4. Throttler Redis store 도입
- [x] `@nest-lab/throttler-storage-redis` + `ioredis` 설치 (2026-05-05)
- [x] `AppModule` ThrottlerModule.forRootAsync로 전환 — REDIS_URL 있으면 Redis 저장소, 없으면 in-memory 폴백 (2026-05-05)
- [x] `.env.example`에 `REDIS_URL` 항목 및 Upstash 연결 방법 주석 추가 (2026-05-05)
- [x] tsc --noEmit 통과 (2026-05-05)
- [x] Upstash Redis 무료 인스턴스 생성 후 `REDIS_URL` Vercel 공유 환경변수에 등록 (2026-05-05)

#### B-5. Toss POS 플러그인 4xx 재시도 제거
- [x] `apps/toss-pos-plugin/src/order.ts` `updateOrderStatus`에서 4xx 응답은 즉시 실패 처리하고, 5xx/네트워크 오류만 재시도 (2026-05-05)
- [x] `apps/toss-pos-plugin/toss-pos-plugin-checkList.md` #15 완료 반영 (2026-05-05)
- [x] `pnpm --filter toss-pos-plugin build` 통과 (2026-05-05)

---

### 🟠 C. 실기기·환경 필요 검증

#### C-1. Toss 실 카드결제 E2E (테스트 카드)
- [ ] Toss 테스트 카드로 배달앱 결제 성공 플로우 전체 확인
  - 주문 생성(`PENDING_PAYMENT`) → 위젯 → 승인 → `PAID` → 주문상세 갱신
- [ ] 결제 실패/취소 플로우 확인 (fail 페이지 → 재시도 안내)
- [ ] 결제 완료 후 관리자 전액 취소 → 배달앱 상태 갱신 확인
- [ ] 결제 완료 후 관리자 부분 환불 확인
- [ ] 결제 후 POS 전송 큐 처리 + 알림 발송 E2E (cron 수동 trigger로)
- [ ] GitHub Actions cron 실제 동작 확인 (`POST /queue/process-once` 응답 로그)

#### C-2. 배달앱 Capacitor 실기기 E2E (Android)
- [ ] Android Studio에서 `.aab`/`.apk` 빌드 성공
- [ ] 실기기 USB 디버깅 연결 후 `npx cap run android` 실행
- [ ] 원격 WebView 로드 확인 (`CAPACITOR_SERVER_URL` 로컬 IP 기반)
- [ ] FCM 토큰 발급 확인 (`POST /devices` 실제 등록 로그)
- [ ] `adb shell am start -d "taco://orders/TEST_ID"` 딥링크 진입 확인
- [ ] 앱 종료 후 백엔드 FCM 발송 → 잠금화면 푸시 수신 확인
- [ ] 푸시 탭 → `/orders/:id` 페이지 라우팅 확인

#### C-3. Android 앱 서명 및 assetlinks.json 배포
- [ ] Android 릴리즈 키스토어 생성 (`keytool -genkey`)
- [ ] SHA-256 인증서 지문 추출 (`keytool -list -v`)
- [x] `apps/delivery-customer/public/.well-known/assetlinks.json` 파일 생성 (2026-05-05) — SHA-256 placeholder, 키스토어 생성 후 교체 필요. Next.js headers `Content-Type: application/json` 자동 적용.
- [ ] 키스토어 SHA-256 확정 후 `assetlinks.json` 업데이트 및 운영 배포 확인
- [ ] `adb shell pm get-app-links com.taco.delivery` 로 App Links 검증

#### C-4. iOS Universal Links 구현 (macOS + Xcode 필요)
- [ ] Xcode → Signing & Capabilities → Associated Domains 추가 (`applinks:delivery.tacomole.kr`)
- [ ] `Info.plist`에 `taco://` custom scheme 확인 (이미 등록됨)
- [x] `apps/delivery-customer/public/.well-known/apple-app-site-association` 파일 생성 (2026-05-05) — TEAM_ID placeholder, Xcode 팀 ID 확인 후 교체 필요.
- [ ] TEAM_ID 확정 후 `apple-app-site-association` 업데이트 및 운영 배포 확인
- [ ] 시뮬레이터 `xcrun simctl openurl booted "taco://orders/TEST_ID"` 확인
- [ ] TestFlight 빌드 후 Universal Link 실기기 확인

#### C-5. Toss SDK/POS 플러그인 실기기 E2E
- [ ] Toss POS 단말기 연결 후 플러그인 앱 실행
- [ ] 백엔드 `POST /queue/process-once` → POS 전송 → 단말 수신 확인
- [ ] POS 전송 실패 시 관리자 화면 재시도 플로우 확인
- [ ] `toss-pos-plugin` 최신 코드 기준 충돌 점검

---

### 🟣 D. 인프라·배포 파이프라인

#### D-1. 배달앱 Google Play 스토어 배포
- [ ] Google Play Console 계정 등록 (개발자 계정 25달러)
- [ ] `capacitor.config.ts` appId `com.taco.delivery` 확정
- [ ] `android/app/build.gradle` versionCode/versionName 설정
- [ ] 릴리즈 `.aab` 빌드: `./gradlew bundleRelease`
- [ ] Play Console 내부 테스트 트랙 업로드 → 심사
- [ ] Vercel 배포 → Capacitor 원격 WebView 핫 업데이트 파이프라인 검증 (심사 없이 업데이트)

#### D-2. 배달앱 Apple App Store 배포 (macOS 필요)
- [ ] Apple Developer Program 등록 (연 129달러)
- [ ] Xcode에서 Archive 빌드 (`Product → Archive`)
- [ ] App Store Connect 앱 등록 + 메타데이터 작성
- [ ] TestFlight 베타 배포 → 내부 테스터 검증
- [ ] App Store 심사 제출

#### D-3. 관리자 Electron 래핑 (PC 전용 수신 프로그램)
- [ ] Electron 프로젝트 초기화 (`apps/admin-electron/`)
- [ ] `BrowserWindow`에 기존 admin 웹 URL 로드
- [ ] 백그라운드 주문 알림: Tray 아이콘 + OS 네이티브 알림
- [ ] 자동 소리 재생 (웹 브라우저 자동재생 차단 우회)
- [ ] 영수증 무음 자동 출력 브리지 (`win.webContents.print()`)
- [ ] Windows `.exe` 인스톨러 빌드 (`electron-builder`)
- [ ] 자동 업데이트 (`electron-updater` + GitHub Releases)

#### D-4. Dev/Prod 환경 분리
- [ ] Supabase 프로젝트 Dev 인스턴스 별도 생성
- [ ] Vercel Preview 배포에 Dev DB/env 자동 연결
- [ ] Production 배포는 main 브랜치 merge 시에만 Prod DB 사용
- [ ] GitHub Actions cron을 Dev/Prod 각각 별도 워크플로우로 분리
- [ ] `.env.development` / `.env.production` 분리 정책 문서화

#### D-5. 운영 모니터링 고도화
- [ ] Sentry Releases 연동: 배포 시 `sentry-cli releases` 자동 실행 (GitHub Actions)
- [x] Sentry Source Map 업로드 설정 완료 (2026-05-05): 배달앱/관리자/홈페이지 `next.config.ts` 모두 `withSentryConfig({ widenClientFileUpload: true, hideSourceMaps: true })` 적용 완료. Vercel 빌드 시 `SENTRY_AUTH_TOKEN` 환경변수 추가하면 자동 업로드.
- [x] Sentry Next.js instrumentation 최신화 (2026-05-05): admin/delivery-customer/table-order `onRequestError` hook 추가, `sentry.client.config.ts`를 `instrumentation-client.ts`로 통합해 빌드 경고 정리.
- [x] `apps/admin/next.config.ts` `compiler.removeConsole` 프로덕션 적용 (2026-05-05) — delivery-customer와 동일 패턴.
- [ ] Vercel Analytics 또는 PostHog 기본 이벤트 트래킹 설정
- [ ] Uptime 모니터링: Better Uptime / UptimeRobot으로 주요 endpoint 감시
- [ ] 백엔드 에러율 알림: Sentry → Slack/Discord 웹훅 연결

---

### ⚪ E. Phase 2 기능 확장

#### E-1. packages/order-core 실제 구현 확장
- [x] 현재 빈 패키지 상태 해소 — 공통 주문 비즈니스 로직 1차 추출 (2026-05-05)
- [x] 주문 유효성 검증 로직 구현: 최소 주문금액, 배달 가능 여부, 매장 활성 상태, 품절/판매중/재고성 검증 (2026-05-05)
- [x] 배달앱/테이블오더 공통 사용 가능한 순수 함수 형태로 구현 (2026-05-05)
- [x] 주문 금액 계산 함수 구현: 상품 합계, 옵션 합계, 배달비, 할인, 최종 결제금액 (2026-05-05)
- [x] 주문 가능 여부 검증 함수 구현: 빈 장바구니, 수량, 메뉴 판매중/품절, 최소 주문금액, 배달 가능 매장 (2026-05-05)
- [x] 순수 함수 타입 export 후 `@order/order-core` 타입 검증 통과 (2026-05-05)
- [ ] 배달앱/테이블오더 기존 계산/검증 로직을 `@order/order-core`로 단계적 이관
  - [x] 배달앱 checkout 금액/최소주문/매장 배달 가능 검증을 `@order/order-core` 계산/검증으로 1차 연결 (2026-05-05)
  - [x] 테이블오더 장바구니/주문확정 금액 계산을 `@order/order-core`로 이관 (2026-05-05)

#### E-1-1. 남은 코드 작업 후보
- [x] Toss POS 플러그인: `catalogId/categoryId` Number 변환 NaN 가드 (2026-05-05)
- [x] Toss POS 플러그인: `removeChannel` 안전화(channel 객체 모듈 변수 보관) (2026-05-05)
- [x] Toss POS 플러그인: polling 명칭을 reconciliation으로 정리 (2026-05-05)
- [x] Toss POS 플러그인: `processOrder` 함수 분해(`buildPluginOrderDto`, `confirmOrCleanup` 등) (2026-05-05)
- [x] Toss POS 플러그인: catalog sync 실패 alert + 백오프 (2026-05-05)
- [x] Brand website: 창업 문의 저장 API/DB 모델/관리자 조회 화면 연결 (2026-05-06): `FranchiseInquiry` Prisma 모델 + 공개 접수 API, 브랜드 server action 저장 연동, 관리자 전용 `/franchise-inquiries` 조회/상태/메모 화면 추가. backend/admin/brand tsc 통과.
- [x] Brand website: Kakao Map 실제 연동 및 운영 키 환경변수 정리 (2026-05-06): `StoreContent.tsx`는 `NEXT_PUBLIC_KAKAO_MAP_KEY`를 사용하고, 로컬에 등록된 키는 운영용으로 확인. 배포 후 지도 렌더링 검증만 별도 필요.
- [ ] Admin E2E 확장: 직접 메뉴 등록
- [ ] Table-order E2E 확장: 첫 주문/추가 주문, QR 재진입 세션 유지, MQ 후처리 지연에도 완료 UX 유지

#### E-2. Toss SDK/POS 채널 정책 확정 및 구현
- [ ] `Order.source = TOSS_POS` 처리 정책 확정
- [ ] Toss POS 직접 주문 시 백엔드 수신 → DB 저장 흐름 구현
- [ ] 관리자에서 Toss POS 주문과 배달앱 주문 구분 표시

#### E-3. 프론트 자동화 테스트 도입
- [x] Playwright 설치 및 기본 설정 (2026-05-05): 루트 `playwright.config.ts` — admin(Desktop Chrome / :3003) + delivery(iPhone 14 / :3001) 두 프로젝트. `webServer` 자동 기동 + 환경변수 폴백 처리. `pnpm test:e2e` / `test:e2e:ui` 스크립트 추가.
- [x] 관리자 E2E 기본 플로우 확장 (2026-05-06): `e2e/admin/auth.spec.ts` — 로그인 폼 렌더링, required 검증, 잘못된 자격증명 에러 표시, 미인증 보호 라우트 7개(/, /orders, /menu, /store, /calls, /operations, /franchise-inquiries) → /login 리다이렉트. 총 10개 테스트.
- [x] 관리자 MQ 운영 화면 E2E (2026-05-06): `e2e/admin/operations.spec.ts` — 인증 세션/API mock으로 POS 실패 1건 + 알림 실패 1건 표시, 각 재시도 PATCH 요청 검증. playwright --list 1 test 확인, admin tsc 통과.
- [x] 관리자 주문/배달 상태/환불 E2E (2026-05-06): `e2e/admin/orders.spec.ts` — 인증 세션/API mock으로 `/orders` 주문 목록 렌더링, 주문 상태 `PAID -> CONFIRMED` PATCH, 배달 상태 `PENDING -> ASSIGNED` PATCH, 전액 취소/부분 환불 payload 검증. 실제 Playwright Chromium 실행 2 tests 통과, admin tsc 통과.
- [x] 관리자 매장 설정 E2E (2026-05-06): `e2e/admin/store.spec.ts` — 인증 세션/API mock으로 `/store` 기본 정보/배달 설정 수정 후 `PATCH /stores/:storeId` payload 검증. 실제 Playwright Chromium 실행 1 test 통과, admin tsc 통과.
- [x] 배달앱 E2E 기본 플로우 (2026-05-05): `e2e/delivery-customer/pages.spec.ts` — 홈 로드, 로그인 페이지 OAuth 버튼, 미인증 주문내역 안내, 메뉴 접근. 총 11개 테스트. playwright --list 18 tests 확인.
- [x] CI GitHub Actions에 Playwright 추가 (2026-05-05): `.github/workflows/ci.yml` 전면 재작성 — pnpm 기반, backend(vitest) + frontend-typecheck(matrix: admin/delivery-customer/brand-website) + e2e(Playwright) 3개 job. 깨진 `apps/frontend` 참조 완전 제거. 실패 시 `playwright-report` artifact 7일 보관.
- [ ] 배달앱 결제 플로우 E2E (Toss 테스트 카드): 주문 생성 → 위젯 → 승인 → PAID (실 환경 필요)

#### E-4. 홈페이지 SEO 및 성능 최적화
- [x] `sitemap.xml` 자동 생성 (2026-05-05): `apps/brand-website/src/app/sitemap.ts` — 5개 주요 URL 등록, Next.js `MetadataRoute.Sitemap` 기반.
- [x] `robots.txt` 설정 (2026-05-05): `apps/brand-website/src/app/robots.ts` — `Allow: /`, sitemap URL 등록.
- [x] Open Graph / Twitter Card 메타태그 완비 (2026-05-05): `layout.tsx` — `metadataBase`, `openGraph`(type/locale/url/siteName), `twitter`(summary_large_image), `robots`(index/follow/googleBot), `opengraph-image.tsx` OG 이미지 자동 생성.
- [ ] Lighthouse 점수 90+ 목표 (LCP, CLS, FID 최적화)
- [ ] 매장/메뉴 정적 생성(ISR) 적용으로 초기 로드 성능 개선

---

### 🧪 F. 운영 테스트 작업 백로그

#### F-1. 운영 배포/DB 검증
- [ ] 운영 DB `prisma migrate deploy` 실행 전 백업/마이그레이션 diff 확인
- [ ] 운영 DB `OrderChannel.HOMEPAGE` 제거 migration 적용 후 주문 조회/관리자 화면 smoke 검증
- [ ] Vercel Production/Preview 환경변수 분리 상태 확인 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FRONTEND_URLS`, `REDIS_URL`, Firebase, Toss, Sentry)
- [ ] GitHub Actions cron `POST /queue/process-once` 실제 실행 로그 확인
- [ ] Queue backlog/failed event가 관리자 `/operations`에서 조회·재시도되는지 운영 데이터로 확인

#### F-2. 결제/환불 운영 테스트
- [ ] Toss 테스트 카드 결제 성공: 주문 생성 → 결제 승인 → `PAID` → 주문 상세 갱신
- [ ] Toss 결제 실패/취소: fail 페이지 안내와 재시도 UX 확인
- [ ] 관리자 전액 취소 후 배달앱 주문 상태/결제 상태 갱신 확인
- [ ] 관리자 부분 환불 후 남은 금액/환불 배지/주문 상세 표시 확인
- [ ] 결제 후 POS 전송 큐 처리와 알림 발송이 중복 발생하지 않는지 확인

#### F-3. 배달앱 실기기/스토어 테스트
- [ ] Android `.apk`/`.aab` 릴리즈 빌드 및 USB 실기기 실행
- [ ] Android FCM 토큰 발급, 잠금화면 푸시 수신, 푸시 탭 라우팅 확인
- [ ] Android App Links `assetlinks.json` SHA-256 교체 후 `adb shell pm get-app-links com.taco.delivery` 검증
- [ ] iOS Associated Domains 추가 후 Universal Link/TestFlight 실기기 확인
- [ ] Vercel 원격 WebView 핫 업데이트 파이프라인 검증
- [ ] PWA 설치, Service Worker 캐싱, 오프라인/불안정 네트워크 안내 확인

#### F-4. POS/관리자 운영 테스트
- [ ] Toss POS 단말기에서 플러그인 앱 실행 및 최신 코드 충돌 점검
- [ ] `POST /queue/process-once` 수동 trigger → POS 주문 수신 확인
- [ ] POS 전송 실패 케이스 생성 후 관리자 MQ 화면에서 실패 조회/재시도 확인
- [ ] 관리자 브라우저 백그라운드 상태에서 주문/직원 호출 알림 수신 확인
- [ ] 영수증 출력/자동 소리 재생 한계 확인 및 Electron 래핑 필요성 재평가
