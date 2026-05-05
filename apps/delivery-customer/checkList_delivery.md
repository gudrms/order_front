# 배달앱 체크리스트
마지막 업데이트: 2026-05-03 (런칭 준비도 감사 결과 반영)

## 🚨 1차 런칭 Blocker

- [x] **[P0] 결제 dead code 삭제** (2026-05-04): `src/features/payment/` 디렉토리 통째 삭제 (`payment.ts` + `types.ts`). import 사용처 0건 확인 후 제거. `tsc --noEmit` 통과.
- [ ] **[P0] 결제 흐름 의존 트리거 확인**: 결제 자체는 동작하나 결제 완료 후 POS 전송/알림이 백엔드 cron 부재로 멈춰 있음 → 사용자에게 "주문 접수" 표시는 되어도 매장에 전달이 안 됨. 백엔드 측 cron blocker 해소 전까지 closed beta 한정 운영

## ⚠️ High risk

- [x] `useDeliveryTracking.ts` mock 데이터 잔여 (2026-05-04): import 사용처 0건 확인 후 `features/delivery-tracking/` 디렉토리 통째 삭제. 실 배달 추적은 `app/orders/[id]/OrderDetailClient.tsx`에서 정상 동작. `tsc --noEmit` + `next build` 19/19 통과
- [x] `MenuDetail.tsx` menuId 미연결 (2026-05-04): import 사용처 0건 확인 후 dead code 삭제. 실 동작 컴포넌트는 옆에 있던 `MenuDetailBottomSheet.tsx` (실 API + Zustand store + 옵션/수량 로직 정상)
- [x] FCM 푸시 알림 프론트 연동 (2026-05-05): `lib/capacitor/push-notifications.ts` 완성. `packages/shared/api/endpoints/devices.ts` 추가. `hooks/usePushNotifications.ts` 구현 — 권한 요청 → 토큰 수신 → `POST /devices` 백엔드 등록 → 포어그라운드 알림 LocalNotifications 표시 → 알림 탭 시 orderId 기반 `/orders/:id` 라우팅. `AuthContext.signOut` 에서 로그아웃 전 `DELETE /devices/:token` + `cleanupPushNotifications` 처리. `PushNotificationHandler` 컴포넌트 → `Providers` (AuthProvider 하위) 마운트. tsc 통과.
- [x] Capacitor `allowMixedContent` 운영 빌드 차단 (2026-05-04): `capacitor.config.ts`에서 `serverUrl?.startsWith('http://')` 기반으로 `cleartext` / `allowMixedContent` 동시 분기. 운영 빌드(HTTPS 또는 server.url 미설정)에선 둘 다 false, 로컬 HTTP dev 서버 붙을 때만 true. MITM 공격면 감소
- [x] AndroidManifest App Links host 정정 (2026-05-04): `delivery.taco.com` → `delivery.tacomole.kr` (manifest + 주석 + 문서 일괄). 코드 로직은 host 무관
- [ ] **후속**: `https://delivery.tacomole.kr/.well-known/assetlinks.json` 운영 배포 (서명 인증서 sha256)
- [ ] **후속**: iOS Universal Links 미구현 — Associated Domains entitlement 추가 + `apple-app-site-association` 호스팅
- [ ] console.log 56개 (21 files) — Sentry treeshake 의존, 빌드 설정 깨지면 정보 누출

## 현재 요약

- 배달앱 결제 정책은 **Toss Payments 선결제만 허용**한다.
- 만나서 결제/현금 결제는 MVP 범위에서 제외한다.
- 로그인, 카카오/Supabase 연동, 주문 생성/조회/상세, 결제 성공/실패 화면은 기본 연결 완료.
- 이번 작업으로 결제 승인 전 고객 주문 취소 API/UI를 연결했다.
- 배달 상태 변경 API와 고객앱 주문상세의 배달 상태 표시를 연결했다.
- 관리자 전액 취소/부분 환불 API와 버튼이 연결됐다.
- MQ 도입 후에도 배달앱의 핵심은 주문/결제/상태/알림 UX다. 큐는 백엔드 후처리 계층이며, 고객앱은 REST API와 주문 상세 polling/Realtime으로 확정된 주문/배달 상태를 표시한다.
- 아직 남은 핵심은 실제 Toss E2E, 결제 후 POS/알림 후처리 중복 노출 점검, PWA/Sentry 검증이다.
- 쿠폰 정책 확정: PERCENTAGE·FIXED_AMOUNT, 1장/주문, 30일 기본 만료, 정률 5000원 상한. 백엔드 Coupon/UserCoupon 모델 + API 구현 완료. 배달앱 체크아웃 쿠폰 선택 UI + 마이페이지 쿠폰 목록 UI 구현 예정.

## 완료

- [x] Next.js App Router 기반 앱 구성
- [x] PWA/Capacitor/Sentry 설정 파일 존재
- [x] React Query Provider 구성
- [x] Supabase Auth Context 구성
- [x] 메뉴/카테고리/장바구니/주소/결제/주문내역/주문상세 UI 구성
- [x] Store Context 추가
- [x] `NEXT_PUBLIC_STORE_ID` 또는 `NEXT_PUBLIC_STORE_TYPE`/`NEXT_PUBLIC_BRANCH_ID` 기반 매장 조회
- [x] 메뉴/카테고리/체크아웃에서 Store Context의 실제 `storeId` 사용
- [x] 체크아웃에서 매장별 최소 주문금액/배달비/무료배달 기준 반영
- [x] Toss Payment Widget UI 연결
- [x] Toss 결제 `customerKey`를 로그인 사용자 ID 기준으로 정리
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
- [x] 백엔드 배달 주문 목록 API 추가
- [x] 백엔드 주문 상세 API 추가
- [x] shared 주문 mapper 추가
- [x] 주문내역 페이지를 실제 API로 전환
- [x] 주문상세 페이지를 실제 API로 전환
- [x] 결제 `PENDING_PAYMENT` timeout/만료 처리 API 추가
- [x] 주문 상태 tracker를 실제 주문 상세 API polling과 Supabase Realtime 병행 구조로 연결
- [x] 엽떡앱 모티브에 맞춰 배달 주문/주문내역/주문상세 로그인 필수 정책으로 전환
- [x] API client가 Supabase access token 자동 주입
- [x] Supabase 사용자와 DB `User` 자동 동기화
- [x] 백엔드 `POST /auth/sync` 인증 사용자 동기화 API 추가
- [x] Toss 결제 성공/실패/중단 화면 문구와 재시도 안내 정리
- [x] Toss 결제 E2E 실행 점검표 추가: `apps/delivery-customer/TOSS_PAYMENT_E2E.md`
- [x] 결제 승인 전 주문 취소 API `PATCH /orders/:orderId/cancel` 연결
- [x] 주문상세 화면에서 결제 승인 전 주문 취소 UI 연결
- [x] 취소된 주문의 주문상세 상태/취소 사유 표시
- [x] 배달 상태 변경 API `PATCH /stores/:storeId/orders/:orderId/delivery-status` 추가
- [x] 주문상세 화면에 배달 상태와 라이더 메모 표시
- [x] 주문상세 화면을 5초 간격으로 재조회해 배달 상태 갱신
- [x] MQ retry/failure 내부 이벤트는 고객앱에 직접 노출하지 않고, 확정된 주문/배달 상태와 최종 알림만 보여주는 정책 확정

## 기술 부채 및 개선 사항 (Technical Debt)

- [x] **UX 개선**: `window.prompt`를 사용한 주문 취소 로직을 Bottom Sheet UI로 교체 (사유 선택 + 직접입력)
- [x] **UX 개선**: 데이터 로딩 시 단순 스피너 대신 Skeleton UI 적용 (메뉴/주문내역/주문상세/주소/찜/마이페이지)
- [x] `test-user-id` 제거 — 주소/찜 API 백엔드에 SupabaseGuard 적용, 프론트 apiClient로 전환
- [x] **라우팅/인가 구조 개선**: 컴포넌트 내부에 산재된 Auth Check 로직을 Next.js Middleware(`middleware.ts`)로 추상화
- [x] **라우팅 구조 개선**: 주문 상세 페이지 URL을 쿼리 파라미터(`?id=`) 방식에서 동적 라우팅(`/orders/[id]`)으로 변경
- [x] **배포 구조 개선**: `output: 'export'` 제거 후 `/orders/[id]` 동적 라우트를 Next 서버/원격 WebView 기준으로 유지
- [x] **Capacitor 기준선 정리**: `CAPACITOR_SERVER_URL` 기반 원격 WebView 설정과 `cap:sync` 스크립트 정리
- [x] **네이티브 기능 연동**: Capacitor `@capacitor/push-notifications` 플러그인 연동 완료 (2026-05-05). 권한 요청 → FCM 토큰 수신 → `POST /devices` 등록. 포어그라운드 수신 시 LocalNotifications 표시. 알림 탭 → `orderId` 기반 라우팅. 로그아웃 시 `DELETE /devices/:token` 토큰 정리.

## 남은 일

### P0: 결제 안정성

- [ ] 실제 Toss 테스트 카드결제 성공 E2E
- [ ] 실제 Toss 테스트 카드결제 실패/취소 E2E
- [ ] 실제 Toss 테스트 결제 전액 취소/부분 환불 E2E
- [x] 결제 timeout/pending 만료 처리
- [x] 중복 callback/idempotency 재시도 정책 보강
- [x] 결제 승인 실패 후 사용자 안내 UI 정리
- [x] 결제 완료 주문의 관리자 환불/취소 API 연결
- [ ] 결제 성공 후 POS/알림 내부 재시도 중 고객에게 중복 알림이 발생하지 않는지 E2E 확인

### P1: 주문 상태와 취소 정책

- [x] 주문 상태 tracker를 실제 주문 상태와 연결
- [x] Realtime 또는 polling 기반 주문 상태 갱신 연결
- [x] 로그인 필수 주문 조회 정책 확정
- [x] 결제 승인 전 고객 주문 취소 정책 확정
- [x] 결제 승인 전 고객 주문 취소 UI 연결
- [x] 결제 완료 후 관리자 전액 취소/부분 환불 정책 구현
- [x] 배달 상태 변경 API 연결
- [x] 취소/환불 상태를 주문내역 카드에도 노출 (REFUNDED/PARTIAL_REFUNDED/CANCELLED 배지)

### P2: 사용자 기능

- [x] API client에 Supabase access token 주입
- [x] Supabase 사용자와 DB `User` 자동 동기화
- [x] 주소 조회/추가/삭제를 실제 사용자 기준으로 동작
- [x] 찜 조회/추가/삭제를 실제 사용자 기준으로 동작
- [x] `test-user-id` 제거 완료
- [x] 쿠폰 데이터 정책 결정 (PERCENTAGE·FIXED_AMOUNT, 1장/주문, 30일 기본, 5000원 정률 상한)
- [x] 백엔드 쿠폰 시스템 구현 완료 (Coupon/UserCoupon 모델, CouponsService/Controller, OrdersService 연동)
- [x] 배달앱 체크아웃 쿠폰 선택 UI (사용 가능 쿠폰 바텀시트 → 1장 선택 → 할인/결제 금액 실시간 반영)
- [x] 배달앱 마이페이지 쿠폰 목록 UI (`/mypage/coupons` — 전체 쿠폰 상태 조회, 프로모코드 등록)

### P2: 스토어 배포 및 PWA/빌드

- [ ] Capacitor 기반 Android `.aab` 빌드 및 구글 플레이스토어 심사 등록 (스토어 검색 최적화)
- [ ] Capacitor 기반 iOS `.ipa` 빌드 및 애플 앱스토어 심사 등록
- [ ] Vercel 배포를 통한 핫 푸시(Hot Push) 무심사 업데이트 파이프라인 검증
- [x] Next.js `output: 'export'` 제거 및 주문상세 동적 라우트 빌드 확인
- [x] Capacitor 원격 WebView URL 설정값 `CAPACITOR_SERVER_URL` 추가
- [x] `ReferenceError: location is not defined` 빌드 경고 제거 (2026-05-05): checkout render 중 `router.push`를 `useEffect` + `router.replace`로 이동하고, Sentry client 설정을 `instrumentation-client.ts`로 통합.
- [x] manifest icon 경로와 실제 asset 정합성 확인 — sharp로 SVG→PNG 8종 생성, apple-touch-icon, favicon-32x32 추가
- [ ] Service Worker 캐싱 전략 검증
- [x] Deep Link 설정: AndroidManifest `taco://` + App Links, Info.plist CFBundleURLTypes, `useDeepLink` 훅 + `DeepLinkHandler` 컴포넌트
- [x] FCM/APNS 푸시 알림 연동 (2026-05-05): 앱 종료 시 배달 상태(배정/픽업/완료/취소) 푸시 수신 준비 완료. 실기기 FCM 토큰 발급 E2E 검증 필요.

## 검증 기록

- [x] `apps/backend`: `tsc --noEmit`
- [x] `packages/shared`: `tsc --noEmit`
- [x] `apps/delivery-customer`: `tsc --noEmit`
- [x] `apps/delivery-customer`: `next build` 통과 및 `/orders/[id]` 동적 라우트 확인
- [x] `apps/backend`: `vitest run src/modules/orders/orders.service.spec.ts` 17 tests 통과
- [x] `apps/backend`: `vitest run src/modules/auth/auth.service.spec.ts` 5 tests 통과
- [x] `apps/backend`: `vitest run src/modules/payments/payments.service.spec.ts` 8 tests 통과
- [x] 최신 백엔드 전체 `vitest run`: **18 files / 142 tests** 전체 통과 (2026-05-01, 쿠폰 테스트 15건 포함)
- [x] 백엔드 Prisma validate/generate 통과
- [x] 개발 DB migration 적용 완료
- [x] 운영 DB queue/POS migration 적용 완료
- [ ] 공식 검증 필요: 카드결제 주문 생성/승인 E2E
- [ ] 주문내역/상세 실제 API E2E
- [ ] Sentry 이벤트 수신 E2E
- [ ] PWA 설치/빌드 검증

## 다음 순서

1. Toss 테스트 카드결제 성공/실패/환불 E2E
3. 결제 성공 주문의 POS/알림 후처리 중 고객 중복 노출 여부 E2E 확인
4. Capacitor 원격 WebView 실기기 실행과 `/orders/[id]` 딥링크 진입 검증
5. ~~`ReferenceError: location is not defined` 빌드 로그 원인 제거~~ — 완료 (checkout render redirect 제거 + Sentry Next instrumentation 최신화)
6. Sentry/PWA E2E 검증

## 최신 동기화 (2026-05-02)

- [x] 배달앱 주문 생성/결제/주문 내역/주문 상세는 인증 사용자 기준 실제 API로 연결 완료
- [x] 쿠폰 선택 UI와 마이페이지 쿠폰 목록 구현 완료
- [x] Toss 결제 성공/실패/중단 및 pending 만료 처리 흐름 반영 완료
- [x] 주문 상세 동적 라우트와 Capacitor 원격 WebView/deeplink 기반 정리 완료
- [ ] 실제 Toss 테스트 카드 성공/실패/환불 E2E
- [ ] 결제 성공 후 POS/알림 후처리 중복 노출 방지 E2E
- [ ] PWA 설치/Service Worker 캐싱/FCM/APNS 푸시 검증

## 최신 동기화 (2026-05-03) — 런칭 준비도 감사

- [x] **결함 식별**: `features/payment/payment.ts` dead code (5개 함수 모두 `success: true` 반환). 즉시 삭제 대상
- [x] **결함 식별**: `useDeliveryTracking.ts` Mock 데이터, `MenuDetail.tsx` menuId 미연결, `push-notifications.ts` TODO 3개
- [x] **결함 식별**: console.log 56개 / `any` 타입 4 files / TODO 13개 (6 files)
- [x] **결함 식별**: Capacitor `allowMixedContent: true` 운영 위험
- [x] **결함 식별**: 자동화 테스트 0건, Playwright 미도입
- [ ] [P0] dead code `payment.ts` 삭제 후 `tsc --noEmit` 재확인
- [ ] 운영 환경 Capacitor 설정 분리 (`allowMixedContent: false`)
- [ ] PWA `manifest.screenshots` 추가 (Play Store 등록 시 필요)
