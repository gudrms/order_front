# Taco Mono 루트 체크리스트
마지막 업데이트: 2026-05-03 (런칭 준비도 감사 — Launch blocker 5개, High risk 5개 식별)

## 🚨 1차 런칭 Blocker (admin / brand-website / delivery-customer + backend)

런칭 직전 반드시 해소해야 하는 항목. 도메인 코어와 운영 인프라는 견고하나, 트리거·대시보드·dead code·CORS·env 설정에 결함 있음.

- [ ] **[P0] MQ consumer 자동 트리거 부재**: `apps/backend/VERCEL_CRON.md`에 따라 Hobby 플랜으로 비활성화 상태. `pos.send_order`, `notification.send`, `payments/expire-pending`, `reconcile`을 호출하는 주체 없음. Vercel Pro / GitHub Actions / Upstash QStash 중 1개 즉시 도입
- [x] **[P0] Admin 대시보드 하드코딩 stats 제거** (2026-05-04): 가짜 숫자(45건/₩842,000/3건/2종)를 `—` placeholder로 전환 + "통계 데이터 연동 준비 중" 안내 배너 추가. 운영자에게 가짜 숫자 노출 차단. 후속 작업: 매장별 일일 통계 API 구현 (별도 항목)
- [x] **[P0] delivery-customer 결제 dead code 삭제** (2026-05-04): `apps/delivery-customer/src/features/payment/` 디렉토리 통째 삭제 (`payment.ts` + `types.ts`). 어디서도 import 안 되던 dead code 확인 후 제거. tsc 통과.
- [x] **[P0] CORS 다중 origin 화이트리스트** (2026-05-04): `apps/backend/src/main.ts` 운영 기본값에 tacomole.kr 5개 도메인(`tacomole.kr`, `www`, `admin`, `delivery`, `order`) + Capacitor scheme(`capacitor://localhost`, `http://localhost`, `https://localhost`) 자동 허용. `FRONTEND_URLS` 콤마 구분 환경변수로 추가 origin override 가능. 기존 `FRONTEND_URL` 단일 값 호환 유지
- [x] **[P0] 백엔드 `.env.example` 정리** (2026-05-04): 중복 복붙 제거 + `INTERNAL_JOB_SECRET`, `FRONTEND_URLS` 추가, 섹션별 주석 정리

## ⚠️ High risk (런칭 후 곧 터질 가능성)

- [ ] 실 Toss 카드결제 자동화 E2E 도입 (`payments-e2e.spec.ts`는 서비스 레이어 mock만)
- [ ] 푸시 알림 미구현 — `apps/delivery-customer/src/lib/capacitor/push-notifications.ts:29,37,46` TODO. FCM/APNS 연결 없으면 배달 상태 알림 불가
- [ ] Throttler in-memory store가 Vercel 다중 인스턴스에서 무력화 → Redis store 도입 검토
- [x] `useDeliveryTracking.ts` mock 데이터 처리 (2026-05-04): import 사용처 0건 확인 후 `features/delivery-tracking/` 디렉토리 통째 삭제 (payment dead code와 동일 패턴). 실 배달 추적은 `app/orders/[id]/OrderDetailClient.tsx` + `@order/shared` `DeliveryStatus`로 이미 정상 동작
- [x] `apps/delivery-customer/src/components/menu/MenuDetail.tsx` menuId 미연결 (2026-05-04): import 사용처 0건 확인 후 dead code 삭제. 실 메뉴 상세는 `MenuDetailBottomSheet.tsx`에서 `useMenuDetail` hook + Zustand `useUIStore.selectedMenuId`로 정상 동작
- [x] Capacitor `allowMixedContent` 운영 빌드 차단 (2026-05-04): 기존 `cleartext` 분기 패턴(`serverUrl?.startsWith('http://')`)을 `allowMixedContent`에도 적용. 운영(HTTPS / unset)에서 false, 로컬 HTTP dev 서버에서만 true. MITM 공격면 감소
- [x] AndroidManifest App Links host 정정 (2026-05-04): `delivery.taco.com` → `delivery.tacomole.kr` (manifest 1건 + 코드 주석 useDeepLink/app.ts 3건 + CAPACITOR_DEEPLINK_TEST.md 4건). 코드 로직은 host 무관(`parsed.pathname` 사용)이라 동작 영향 없음
- [ ] **후속**: 운영 배포 시 `https://delivery.tacomole.kr/.well-known/assetlinks.json` 호스팅 필요 (sha256 서명 인증서 지문 등록)
- [ ] **후속**: iOS Universal Links 미구현 — `Info.plist`에 `taco://` custom scheme만 있고 Associated Domains capability 없음. 추가 작업: Xcode entitlements + `apple-app-site-association` 호스팅 + `applinks:delivery.tacomole.kr` 등록

## 🧱 Tech debt (누적 시 문제)

- [ ] 프론트 자동화 테스트 0건 (admin/brand-website/delivery-customer) — Playwright 도입
- [ ] `apps/backend/src/modules/orders/orders.controller.ts:11-22` 인라인 OrderStatus enum 제거 (Prisma enum 사용)
- [ ] 백엔드 단일 serverless function 라우팅 (`apps/backend/vercel.json`) — queue function 분리 검토
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
- [ ] 관리자 MQ 운영 화면 브라우저 E2E
- [ ] Toss SDK/POS 실제 기기 E2E
