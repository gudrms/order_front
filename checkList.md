# Taco Mono 작업 현황

마지막 업데이트: 2026-05-16 (5차)

---

## 🔴 P0 — 즉시 조치 (보안/치명 버그)

### 보안

- [x] **env sync 체계 도입** (2026-05-12): `scripts/sync-env.js` + `pnpm sync:env`. 루트 `all-in-one-shared.env.local` 단일 소스 → 앱별 `.env.local` 자동 생성.
- [x] **실값 env 파일 git untrack** (2026-05-12): `all-in-one-shared.env`, `backend-env.env`, `.env.direct`, `.env.pooler` `git rm --cached` 완료. `.gitignore` 보강.
- [ ] **실 운영 시크릿 rotate**: git 히스토리에 노출된 아래 키들 즉시 재발급 후 `all-in-one-shared.env.local` + Vercel 대시보드 갱신.
  - Supabase DB 비밀번호 + `SUPABASE_SERVICE_KEY` (Supabase 대시보드)
  - `TOSS_ACCESS_KEY` / `TOSS_ACCESS_SECRET` (Toss 콘솔)
  - `INTERNAL_JOB_SECRET` → 11자 이상 값으로 교체
  - Gmail 앱 비밀번호 `EMAIL_PASS` (Google 계정 설정)
  - **`SUPABASE_SERVICE_KEY`는 `all-in-one-shared.env.local`에 별도 추가 필요** (기존 파일에 누락)
- [x] **git 히스토리에서 시크릿 완전 제거** (2026-05-12): `python3 -m git_filter_repo`로 4개 env 파일 히스토리 완전 제거 (304개 커밋 재작성). `git push --force origin master` 완료.
- [ ] **CORS 개발 모드 전체 허용 제거** *(우선 안 함)*: `apps/backend/src/main.ts:203` — `NODE_ENV=development` 시 모든 origin 허용 + `credentials:true` 조합. 개발도 localhost 화이트리스트로 제한.
- [x] **Vercel 클라이언트 IP 기반 Rate Limiting 연결** (2026-05-13): `CustomThrottlerGuard`를 전역 `APP_GUARD`로 연결. `x-forwarded-for` 첫 IP → `req.ip` → `remoteAddress` 순서로 tracker를 산정하고, 제한 초과 시 `ThrottlerException(429)`을 반환하도록 정리. `tsc -p apps/backend/tsconfig.json --noEmit` 통과.
- [x] **Backend Cron 헬스체크 타임아웃 원인 수정** (2026-05-13): Vercel `/api/v1/health`가 전체 `AppModule` 정적 import/부팅 전에 fast path로 응답하도록 `src/main.ts`를 동적 import 구조로 변경. Config validation 전에 liveness 응답 가능. `TOSS_SECRET` 필수 검증도 실제 env 이름인 `TOSS_ACCESS_SECRET` 기준으로 수정. `tsc -p apps/backend/tsconfig.json --noEmit` 통과.
- [x] **all-in-one env 키 목록 보정** (2026-05-13): `all-in-one-shared.env.example`과 로컬 `all-in-one-shared.env`에 `SUPABASE_SERVICE_KEY`, `TOSS_PAYMENTS_SECRET_KEY` 키 추가. 실제 secret 값은 사용자가 채운 뒤 Vercel Shared Env로 import 필요.
- [x] **Backend Cron queue 처리 타임아웃 완화** (2026-05-14): GitHub Actions `Process Queue` curl 제한이 30초라 Vercel queue 함수(maxDuration 60s) cold start/pgmq 처리 중 exit 28 발생. `--max-time 75`, `quantity:3`, retry 제거로 조정해 한 run 내 중복 consumer 기동 가능성을 낮춤.
- [ ] **Vercel backend 운영 env 누락 보정**: Production/Preview에 `SUPABASE_SERVICE_KEY`, `TOSS_ACCESS_SECRET` 또는 `TOSS_PAYMENTS_SECRET_KEY`, `INTERNAL_JOB_SECRET(11자 이상)` 설정 확인. GitHub Actions `INTERNAL_JOB_SECRET`와 Vercel backend 값 일치 필요.
- [ ] **Rate Limiting tracker 신뢰 경계 테스트 보강**: `x-forwarded-for` 단일/복수 IP, 빈 헤더, 로컬 fallback, 제한 초과 429 응답을 `CustomThrottlerGuard` 단위 테스트로 고정.
- [ ] **프록시 헤더 신뢰 정책 문서화**: Vercel/Edge 뒤에서만 `x-forwarded-for`를 신뢰한다는 전제를 `docs/architecture.md` 또는 운영자 문서에 명시. 직접 서버 노출 시 `trust proxy`/WAF 정책 재검토.

### 치명 버그

- [x] **`apiClient` fallback URL 운영 주소로 수정** (2026-05-16): `packages/shared/src/api/client.ts` — `NEXT_PUBLIC_API_URL` 미설정 시 `http://localhost:3000/api/v1` → `https://api.tacomole.kr/api/v1`로 교체. 서버사이드 `DOMAINS.API` fallback과 통일. Vercel 빌드 시 환경변수 미설정이면 클라이언트 번들에 localhost가 고정되어 delivery/table-order 메뉴 API 호출 실패 → 무한 로딩 발생 원인.
- [ ] **Vercel `NEXT_PUBLIC_API_URL` 환경변수 설정**: `order-delivery`, `order-front-frontend` 두 프로젝트 모두 Production/Preview에 `NEXT_PUBLIC_API_URL=https://api.tacomole.kr/api/v1` 추가 → 재배포 필요. `NEXT_PUBLIC_*`는 빌드 타임 embed이므로 env 설정 후 반드시 새 배포.
- [x] **Supabase OAuth redirect URL 허용 목록에 delivery 도메인 추가** (2026-05-16): Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs에 `https://*.tacomole.kr/**` 와일드카드 추가. Site URL을 `https://delivery.tacomole.kr/`로 변경. 로그인 후 table-order로 리다이렉트되던 문제 해소.
- [ ] **Vercel 프로젝트-앱 매핑 확인**: `order-front-frontend` = table-order 앱, `order-delivery` = delivery-customer 앱. Capacitor Remote WebView URL도 `order-delivery` 도메인으로 설정해야 함.
- [x] **브랜드 사이트 CORS 차단 (304 캐시 오염)** (2026-05-16): `tacomole.kr`에서 `api.tacomole.kr/api/v1/stores` 요청 시 ACAO 헤더가 `delivery.tacomole.kr`로 잘못 반환. ETag 기반 304 응답에 오염된 캐시 헤더가 재사용된 것. `expressApp.set('etag', false)`(ETag 생성 차단) + `Vary: Origin`(CDN 분리) + `Cache-Control: no-store`(브라우저 캐시 완전 비활성화) 세 겹으로 해소. push 필요.
- [x] **Supabase 누락 마이그레이션 3개 적용** (2026-05-16): `20260505` OrderChannel HOMEPAGE enum 제거, `20260506` FranchiseInquiry 테이블 생성(가맹 문의 폼 "table does not exist" 에러 해소), `20260516` UserFavoriteStore `_prisma_migrations` 등록(수동 생성된 테이블 Prisma 상태 동기화).

- [x] **`updateOrderStatus` localStorage mock 제거** (2026-05-12): `packages/shared/src/api/endpoints/order.ts` + `apps/table-order/src/lib/api/endpoints/order.ts` — localStorage mock → `PATCH /stores/:storeId/orders/:orderId/status` 실 API 호출로 교체. 시그니처 `(orderNumber, status)` → `(storeId, orderId, status)` 변경.
- [x] **`generateOrderNumber` 동시성 취약점** (2026-05-12): DB 레벨 `@@unique([storeId, orderNumber])` 제약이 이미 스키마에 존재 확인. `count() + 1` 중복 발급 시 Prisma P2002 → 트랜잭션 롤백으로 안전. 주석 추가. (진짜 해법은 DB 시퀀스이나 현재 구조로 안전성 확인됨)
- [x] **`updateOrderStatus` 상태 전이 검증 부재** (2026-05-12): `apps/backend/src/modules/orders/orders.service.ts` — `ALLOWED_TRANSITIONS` static 맵 10개 상태 전체 정의 + 허용되지 않은 전이 `BadRequestException` 처리 추가.

---

## 🔴 P0 — 저장소 위생

- [x] **거대 임시 파일 삭제** (2026-05-12): `tree_output.txt`, `tree_output_utf8.txt` 이미 없음 확인. `.gitignore`에 `tree_output*.txt` 패턴 추가 완료.

---

## 🟡 P1 — 주요 개선

### 코드 품질

- [x] **`OrdersService` 분리** (2026-05-12): 616줄 → `orders.service.ts`(302줄) + `delivery-order.service.ts`(245줄) + `order-helpers.ts`(103줄)으로 분리. RootOrdersController는 DeliveryOrderService 직접 주입. 테스트도 분리.
- [x] **`QueueConsumerService` 분리** (2026-05-12): 584줄 → `PaymentEventHandler`(153줄) + `PosEventHandler`(78줄) + `NotificationEventHandler`(131줄) + thin dispatcher `QueueConsumerService`(211줄). `@Optional()` 의존성 전부 required로 전환. 150개 테스트 통과.
- [x] **`optional` 의존성 패턴 재검토** (2026-05-12): `orders.service.ts` — `queueService?`, `couponsService?` → 필수 주입으로 변경. `?.` optional chaining 2곳, `&& this.couponsService` 가드 2곳 제거. `OrdersModule`에 두 모듈 모두 import되어 있어 항상 주입 보장됨.
- [x] **`shared` / `table-order` 타입 불일치 정리** (2026-05-12): `apps/table-order/src/types/` 하위 6개 파일(order.ts·call.ts·api.ts·table.ts·menu.ts·index.ts) 전부 삭제. grep으로 실제 사용처 없음 확인. 모든 코드 이미 `@order/shared` 직접 사용 중.
- [x] **API 클라이언트 중복 제거** (2026-05-12): `apps/table-order/src/lib/api/client.ts` 삭제. 엔드포인트 5개 + `OrderConfirmModal` + `lib/api/index.ts` 모두 `@order/shared` import로 교체. tsc 에러 없음.
- [x] **`shared`와 `order-core` 책임 경계 재정의** (2026-05-12): `cartStore.ts` → `packages/order-core/src/stores/` 이관. 앱 6곳 import `@order/shared/stores/cartStore` → `@order/order-core` 교체. `shared` package.json에서 zustand 의존성 제거. tsc 에러 없음.

### 인프라/설정

- [x] **프로덕션 Redis 경고 로그** (2026-05-12): `apps/backend/src/app.module.ts` — `NODE_ENV=production` && `REDIS_URL` 없으면 부팅 시 `console.warn` 출력 (성능 저하 모드 명시). 부팅 실패 대신 경고로 처리 — Redis 장애가 서비스 다운으로 이어지지 않도록.
- [x] **환경변수 ConfigService 일원화** (2026-05-12): `joi` 설치 후 `ConfigModule`에 `validationSchema` 추가 (DATABASE_URL, SUPABASE_*, TOSS_*, INTERNAL_JOB_SECRET 필수 검증). `queue.service`, `queue.controller`, `payments.controller`, `notification-provider.service` 4곳 `process.env.*` → `ConfigService.get()` 교체. main.ts·logger는 bootstrap 컨텍스트로 그대로 유지. 150개 테스트 통과.
- [x] **Serverless cold start 최적화** (2026-05-12): `queue-app.module.ts` 슬림 모듈 도입. `api/queue.ts`가 17개 전체 모듈 대신 ConfigModule + QueueModule + NotificationsModule만 로드. HTTP 전용 11개 모듈(Auth, Menus, Orders, Stores 등) 제외. `queue.ts` 독립 부트스트랩으로 분리(Swagger/CORS/Throttler 제외).

### 기능

- [x] **배달앱 매장 선택 흐름 구현 — URL 기반으로 전환** (2026-05-16): 처음엔 localStorage 방식으로 구현했으나 URL 공유·북마크 불가 문제로 URL 기반으로 재설계. 라우트 구조를 `/menu`, `/order/*` → `/store/[storeId]/menu`, `/store/[storeId]/order/*` 로 전환. `StoreContext`에서 localStorage 완전 제거 — `/store/[storeId]/layout.tsx`가 `storeId`로 매장을 fetch 후 `StoreProvider`에 주입. Toss `successUrl`·`failUrl`도 새 URL 패턴으로 업데이트. 홈에서 매장 선택 시 `/store/${id}/menu` 로 이동.
- [x] **배달앱 장바구니 최소주문금액 매장 정책 연동** (2026-05-16): `CartBottomSheet`의 하드코딩 `15,000원` 검증을 제거하고 `StoreContext.store.minimumOrderAmount` 기준으로 안내/주문 진행을 판단하도록 수정. `/orders` 전역 라우트는 `StoreProvider` 밖에서도 빌드되도록 선택 매장 안내 상태를 추가. `pnpm --filter delivery-customer type-check` 및 `build` 통과.
- [x] **마이페이지 헤더 네비게이션 추가** (2026-05-16): 뒤로가기(←) 및 주문하기 버튼 추가. 홈(`/`)으로 이동.
- [x] **매장 즐겨찾기 (DB 기반)** (2026-05-16): `UserFavoriteStore` Prisma 모델 추가 + migration SQL 생성 및 Supabase 운영 DB 적용. 백엔드 `GET /users/me/favorite-stores` / `POST /users/me/favorite-stores/:storeId/toggle` 엔드포인트 추가. shared `FavoriteStore` 타입 + `getFavoriteStores()` / `toggleFavoriteStore()` API 함수 추가. 배달앱 홈 화면에 하트 버튼(로그인 사용자만 표시) + "즐겨찾기 매장" 섹션(상단 노출). `useFavoriteStores` 훅에 optimistic update 적용.
- [x] **메뉴 이미지 업로드 기능** (2026-05-16): admin 메뉴 등록/수정 시 이미지 URL 직접 입력 → 파일 업로드로 교체. admin에서 클라이언트 압축(`browser-image-compression`, max 1MB/1280px) 후 백엔드 `POST /stores/:storeId/menus/image` 경유, 백엔드 `StorageService`가 `SUPABASE_SERVICE_KEY`로 Supabase Storage 기존 `assets` 버킷의 `menu/{storeId}/{uuid}.ext` 경로에 저장하고 public URL 반환. 권한은 `assertCanManageAdminDirectMenus` 재사용. Vercel 요청 본문 ~4.5MB 제한 때문에 클라 압축 필수.

### 테스트

- [ ] **실 Toss 카드결제 E2E**: `payments-e2e.spec.ts`는 서비스 레이어 mock 한정. 실 HTTP 콜백 / idempotency / 취소 무점검. 운영 테스트 매장은 배달 주문 ON, 최소주문금액 0원, `E2E 테스트 타코` 10원으로 세팅 완료. `496603e` 배포 후 장바구니 → 주소 입력 → Toss 결제창 진입 재검증 필요.
- [ ] **Toss Payments 결제위젯 이용 신청 대기**: Toss Payments `API 키` 화면 상단의 "결제위젯 연동 키" 영역이 현재 `전자결제 신청하고 확인할 수 있어요` 상태. 신청 승인/활성화 후 `test_gck_...`(클라이언트 키), `test_gsk_...`(시크릿 키)가 노출되어야 실 결제위젯 테스트 가능.
  - 신청 주체: 1호점 실제 운영 사업자/대표자 정보 기준.
  - 정산 계좌: 1호점 사업자 또는 대표자 명의 계좌.
  - 결제수단: 초기 오픈은 카드, 토스페이, 카카오페이, 네이버페이 중심. 삼성페이는 카드 수수료 +0.30%p라 초기 제외 가능. 계좌이체/가상계좌/에스크로는 배달앱 즉시 주문 UX와 운영 복잡도 때문에 보류.
  - 가맹 확장 시: 매장별 MID 분리 또는 Toss 하위몰/정산대행 구조 문의.
- [ ] **Toss Payments 결제위젯 키 세팅**: 결제위젯 SDK는 일반 API 키(`test_ck_...`/`test_sk_...`)가 아니라 결제위젯 연동 키(`test_gck_...`/`test_gsk_...`) 사용. `delivery-customer` Vercel `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_...`, backend Vercel `TOSS_PAYMENTS_SECRET_KEY=test_gsk_...`로 같은 상점 키 세트인지 확인 후 재배포. Toss 콘솔의 "API 개별 연동 키"(`ck`/`sk`, 기존 결제창·자동결제·정산지급대행용)는 이번 결제위젯 연동에 사용하지 않음.
- [ ] **Toss 리다이렉트 URL 등록**: 운영 도메인 기준 `https://delivery.tacomole.kr/store/*/order/success`, `https://delivery.tacomole.kr/store/*/order/fail` 등록. Vercel preview 결제 테스트가 필요할 때만 `https://*.vercel.app/store/*/order/success|fail` 추가. `delivery.tacomolly.kr`는 DNS 없음.
- [x] **Toss 웹훅 백엔드 구현** (2026-05-16): `POST /api/v1/payments/toss/webhook` 추가. `PAYMENT_STATUS_CHANGED`, `CANCEL_STATUS_CHANGED` 이벤트를 받고, 웹훅 body를 그대로 신뢰하지 않고 Toss API `fetchPaymentByOrderId`로 재조회한 뒤 로컬 Payment/Order 상태를 idempotent하게 보정. 결제 완료(`DONE`)는 `PAID` 처리 및 POS/알림 큐 발행, 취소(`CANCELED`/`PARTIAL_CANCELED`)는 `REFUNDED`/`PARTIAL_REFUNDED` 보정, 만료/중단(`EXPIRED`/`ABORTED`)은 대기 결제 실패 처리. `payments.service.spec.ts` 웹훅 성공/취소 케이스 추가.
- [x] **Toss 웹훅 콘솔 등록** (2026-05-16): Toss 콘솔 웹훅 메뉴에 이름 `Tacomolly Delivery Payments`, URL `https://api.tacomole.kr/api/v1/payments/toss/webhook`, 이벤트 `PAYMENT_STATUS_CHANGED`, `CANCEL_STATUS_CHANGED` 등록 완료. Toss 문서 기준 10초 안에 200 응답 필요, 실패 시 재전송됨. `api.tacomolly.kr`는 DNS 없음. 브라우저 주소창 GET 404는 정상이며, Toss 웹훅은 POST로 호출된다.
- [x] **Toss 승인 대기 중 가능한 사전 검증** (2026-05-16): 운영 배포 `https://delivery.tacomole.kr/store/test-admin-direct-store/order/checkout/`에서 결제위젯 키가 없을 때 `test_ck_...` fallback으로 401을 내지 않고 "결제 설정 미준비" 상태와 비활성 결제 버튼으로 막히는지 확인. 운영 API `POST https://api.tacomole.kr/api/v1/payments/toss/webhook`도 미지원 이벤트 payload에 200 + `UNSUPPORTED_EVENT_TYPE` 응답 확인.
- [ ] **테이블오더 첫 주문/추가 주문 E2E**: 브라우저-백엔드 통합 E2E 미작성.
- [ ] **백엔드 미작성 모듈 테스트**: `error-logs`, `sessions`, `integrations/toss`, `menu-detail`, `app.module`.
- [x] **DB schema `OrderChannel.HOMEPAGE` 제거** (2026-05-16): Supabase 운영 DB에서 enum 값 제거 완료. `Order.source` DEFAULT 임시 해제→타입 변환→재설정 순서로 적용. `_prisma_migrations`에 등록.

### E2E 테스트 커버리지 점검 (2026-05-16)

루트 Playwright 1개로 통합 — 3개 프로젝트(admin :3003, delivery :3001, table-order :3002), `e2e/global-setup.ts` stub 백엔드(:4000). 모든 E2E가 Supabase/백엔드를 mock·stub → 실제 인증·DB·결제 흐름 미검증.

현재 시나리오:
- **admin** (4 spec, ~16 테스트): auth(폼·검증·에러·보호 라우트 7개), menu(ADMIN_DIRECT 생성·TOSS_POS 동기화), orders(상태·환불 1개), store(설정 저장 1개), operations(실패 재시도 1개)
- **delivery-customer** (3 spec, ~33 테스트): 홈/레이아웃, 로그인, 미인증 주문내역, 메뉴 페이지(`/store/store-e2e-1/menu`, 2026-05-16 경로 수정) + 결제 결과 UI 12개(`payment.spec.ts`) + 메뉴→장바구니→결제하기 풀 플로우 11개(`menu-cart.spec.ts`, 2026-05-16 추가)
- **table-order** (1 spec, 3 테스트): QR 진입만 (잘못된 번호·0번·유효 리다이렉트). vitest 설정만 있고 테스트 0개
- **brand-website** (1 spec, 21 테스트): 랜딩·메뉴·브랜드·가맹·매장·개인정보 6페이지. Playwright `brand-website` 프로젝트 port 3000 (2026-05-16 추가)
- **backend**: 진짜 E2E 없음. `payments-e2e.spec.ts`는 이름만 e2e (Toss mock 통합)

배포 전 우선순위로 채울 시나리오:
- [ ] **table-order 주문 플로우 E2E**: QR→메뉴 선택→장바구니→주문→결제→추적. 제품 핵심인데 현재 0.
- [x] **delivery-customer 결제 결과 페이지 E2E** (2026-05-16, `payment.spec.ts`): 성공 페이지 confirm API mock(로딩·성공·재시도·에러·버튼 네비게이션 7개), 실패 페이지(메시지·버튼 네비게이션·빈 orderId 4개), 체크아웃 빈 장바구니 리다이렉트 1개 — 합계 12 tests 통과.
- [x] **delivery-customer 메뉴→장바구니→결제하기 E2E** (2026-05-16, `menu-cart.spec.ts`): 메뉴 목록·상세 시트·수량 조절·담기(4개), 배지 갱신·최소 주문금액 안내(3개), 장바구니 시트 아이템·닫기(2개), 배달 정보 입력→체크아웃 이동·주문 내역 확인(2개) — 합계 11 tests 통과.
- [ ] **delivery-customer OAuth 로그인 후 실결제 플로우**: 로그인 세션 시뮬레이션, 주문 추적, 마이페이지. (TossPayments 위젯 외부 SDK는 계속 범위 외)
- [ ] **admin 메뉴 이미지 업로드 E2E**: 2026-05-16 추가 기능. 회귀 방지용 — 파일 선택→압축→업로드→URL 저장 시나리오.
- [ ] **admin 미커버 플로우 E2E**: 옵션 그룹 CRUD, 직원 호출 실시간, 가맹 문의 처리.
- [x] **brand-website E2E 도입** (2026-05-16): `e2e/brand-website/fixtures.ts`(매장·메뉴 API 스텁) + `pages.spec.ts`(21 tests, 랜딩·메뉴·브랜드·가맹·매장·개인정보 6페이지). Playwright `brand-website` 프로젝트 port 3000 추가.
- [x] **delivery-customer E2E 메뉴 경로 수정** (2026-05-16): `/menu` 라우트가 `/store/[storeId]/menu`로 리팩터링되면서 CI E2E 실패. `e2e/delivery-customer/pages.spec.ts` 메뉴 관련 테스트 2개를 `/store/store-e2e-1/menu` 경로로 수정.
- [ ] **cross-app 동기화 E2E**: admin 메뉴 변경 → table-order/delivery 실시간 반영, 결제 webhook → UI 갱신.

---

## 🟢 P2 — 점진 개선

### 코드 품질

- [x] **`any` 타입 제거** (2026-05-12): order-helpers(tx→Prisma.TransactionClient), orders.service(status→OrderStatus, deliveryStatus→DeliveryStatus, where→Prisma.OrderWhereInput), payments.service(orderUpdateData→Prisma.OrderUpdateInput), stores.service/delivery-order.service(JSON→Prisma.InputJsonValue), toss-api.service(error.data→Record<string,unknown>), pos.controller(toPosPaymentDto 파라미터 명시). 150개 테스트 통과.
- [x] **`table-order` 폴링 → Realtime 교체** (2026-05-12): refetchInterval 제거. Supabase postgres_changes 구독으로 교체. getOrdersByTable이 sessionId도 반환하도록 리팩터링 — sessionId 확정 후 정밀 필터(sessionId=eq.${id})로 재구독, 미확정 시 storeId 폴백.
- [x] **`table-order` 로컬 API 레이어 정리** (2026-05-12): `apps/table-order/src/lib/api/index.ts`에서 `@order/shared` API를 기본으로 사용하고, table-order 전용 주문 분기만 `lib/api/endpoints/order.ts`에 유지.
- [x] **`useCreateOrder` queryKey 범위 축소** (2026-05-12): 주문 생성 후 `['orders', 'table', storeId, variables.tableNumber]`만 무효화하도록 반영.
- [ ] **프론트엔드 단위 테스트 도입**: 화면 미확정으로 추후 진행. cartStore(순수 로직)는 우선순위 높음.
- [x] **`packages/order-core` 비즈니스 로직 실제 구현 확장** (2026-05-12): 주문 합계, 배달비, 할인, 매장 정책, 품절/재고/옵션 검증과 `useCartStore` 책임을 `@order/order-core`에 정리.

### 문서 (README/내부)

- [x] **`packages/shared/README.md` 전면 업데이트** (2026-05-12): 공통 타입/API/hook/util과 `@order/order-core` 책임 경계를 실제 구조 기준으로 재작성.
- [x] **`packages/ui/README.md` 내용 보강** (2026-05-12): 실제 컴포넌트 목록, UI 기술 스택, `@order/ui/payment` 서브패스 dynamic import 방식을 추가.
- [x] **`packages/order-core/README.md` 사용 예시 추가** (2026-05-12): 주문 합계/검증, `useCartStore` 예시와 `@order/shared` 책임 경계를 추가.
- [x] **`apps/table-order/src/` 내부 README 재작성** (2026-05-12): `features/`, `hooks/`, `lib/`, `stores/`, `types/` README를 실제 파일 구조 기준으로 교체.
- [x] **운영자 인수인계 문서 작성** (2026-05-12): `docs/operator-handoff.md`에 장애 대응, 운영 엔드포인트, cron 확인, Android 앱 지문/키 기준을 정리.
- [x] **README/architecture 최신화** (2026-05-13): 루트 README, `docs/architecture.md`, `apps/table-order/README.md`, `apps/delivery-customer/README.md`, `apps/brand-website/README.md`를 실제 코드 기준으로 갱신. table-order Realtime, 배달 주문 `/orders`, 내부 배치 secret, Redis-backed rate limiting, Sentry/Winston/Vercel Logs 기준 반영.
- [x] **포트폴리오용 Notion 초안 작성** (2026-05-13): 루트 `notion.md` 생성. README/architecture와 실제 코드 확인 결과를 기준으로 기술 스택, 운영 안정성/보안, 큐, 비용 절감, 테스트 성과를 정리.
- [ ] **API 경로 문서 자동화**: `docs/architecture.md`의 주요 API 라우트가 컨트롤러와 어긋나지 않도록 OpenAPI/Swagger JSON에서 라우트 목록을 생성하는 스크립트 추가 검토.
- [ ] **문서 인코딩/콘솔 출력 가이드**: Windows PowerShell에서 한글 README가 깨져 보일 수 있으므로 UTF-8 확인 방법(`Get-Content -Encoding UTF8`, 에디터 UTF-8)을 `docs/setup.md`에 짧게 추가.
- [ ] **ADR 문서 추가**: `docs/adr/`에 주요 기술 의사결정 기록. 우선순위: pgmq 선택 이유, Vercel Serverless 선택 이유, Redis-backed Throttler 도입 이유, Capacitor Remote WebView 방식 선택 이유.
- [ ] **비용 산정 근거 문서 작성**: `docs/cost-model.md`에 NCP 서버/DB 월 비용과 Vercel/Supabase 초기 운영 비용 비교, 무료 Tier 한계, 유료 전환 기준 정리.
- [ ] **체크리스트 문서 분리**: 현재 `checkList.md`가 커지고 있으므로 출시 검증은 `docs/launch-checklist.md`, 운영 점검은 `docs/operations-checklist.md`, 개발 작업은 `checkList.md`로 분리 검토.

---

## 📱 앱 배포 (출시 전 완료)

### Android (배달앱)

- [x] 릴리즈 keystore 생성 (2026-05-12): `android/app/taco-release-key.keystore` (alias: taco-key). `android/key.properties`에 비밀번호 기록. `.gitignore`에 keystore + key.properties 추가.
- [x] `android/app/build.gradle` 서명 설정 (2026-05-12, 2026-05-16 재확인): `signingConfigs.release` 블록 추가. `android/key.properties`에서 `taco-key` 업로드 키를 자동 로드하고 `bundleRelease` 산출물이 서명되도록 고정.
- [x] `capacitor.config.ts` appId `com.tacomole.app` 확정 (2026-05-12, Play Console 패키지명 기준으로 2026-05-16 보정)
- [x] `android/app/build.gradle` versionCode 2 / versionName "1.0.1" 설정 (2026-05-16): Play Console의 기존 versionCode 1 중복 오류 대응.
- [x] Google Play API 수준 35 요구 대응 (2026-05-16): `apps/delivery-customer/android/variables.gradle`의 `compileSdkVersion`/`targetSdkVersion`을 35로 상향. Play Console의 target API 34 업로드 오류 보정.
- [x] 운영 URL cap sync (2026-05-12, 2026-05-16 재수행): `CAPACITOR_SERVER_URL=https://delivery.tacomole.kr pnpm --filter delivery-customer exec cap sync android`. Remote WebView 방식으로 Vercel 배포 앱을 WebView로 로드.
- [x] 릴리즈 `.aab` 빌드 완료 (2026-05-12, 2026-05-16 재빌드): Play Console 패키지명 `com.tacomole.app`, versionCode 2 / versionName "1.0.1" 기준으로 `android/app/release/app-release.aab` 재생성. `jarsigner -verify`로 `taco-key` 서명 확인. 기존 `com.taco.delivery` AAB는 Play Console 업로드 불가.
- [x] Google Play Console 개발자 계정 등록 완료 (2026-05-12)
- [x] 기존 전달 SHA-256 지문 참고값 기록 (2026-05-12): `6D:AC:8F:5E:5D:A7:AF:F6:80:01:16:6D:78:17:B6:29:62:F2:DC:82:5F:DC:3D:7C:B7:B3:4B:61:B9:04:F2:80`
- [x] 개인정보처리방침 페이지 생성 (2026-05-12): `apps/brand-website/src/app/privacy/page.tsx` → `https://www.tacomole.kr/privacy`
- [x] brand-website push → Vercel 배포 후 `https://www.tacomole.kr/privacy` 접근 확인 (2026-05-16)
- [x] Google Play 스토어 등록정보 자산 생성 (2026-05-16): `apps/delivery-customer/store-assets/google-play/`에 앱 아이콘(512x512), 그래픽 이미지(1024x500), 휴대전화/7인치/10인치 태블릿 스크린샷 각 2장 정리. 커밋 `ddf22e2`.
- [x] Play Console 기본 등록정보 초안 정리 (2026-05-16): 앱 이름 `타코몰리`, 카테고리 `음식 및 음료`, 간단한/자세한 설명, 외부 마케팅 기본 허용 기준 정리.
- [x] Play Console 데이터 보안/금융 기능 응답 기준 정리 (2026-05-16): 개인정보(이름/이메일/사용자 ID/주소/전화번호), 금융 정보(결제 정보/구매 내역), 앱 활동(Analytics), 앱 정보 및 성능(Sentry), 기기 또는 기타 ID(FCM/Analytics) 기준. 금융 기능은 `모바일 결제 및 디지털 지갑`.
- [x] Play Console 등록정보 최종 저장 (2026-05-16): 개인정보처리방침 URL(`https://www.tacomole.kr/privacy`), 앱 아이콘/그래픽 이미지/스크린샷 업로드, 연락처, 콘텐츠 등급 설문 제출.
- [x] Play Console 광고 ID 선언 완료 (2026-05-16): Android 13+ targetSdk 정책 대응. 앱에서 광고 ID를 사용하지 않는 기준으로 선언.
- [x] Play Console 공개 테스트 출시 버전 생성 및 심사 제출 (2026-05-16): App Bundle 2 (`1.0.1`, versionCode 2)만 포함하고 기존 App Bundle 1 (`1.0.0`, versionCode 1)은 현재 출시 버전에서 제거. 관리형 게시 기준으로 Google 승인 대기.
- [x] Play App Signing SHA-256 확정 및 `assetlinks.json` 교체 (2026-05-16): Play Console 앱 서명 키 SHA-256 `6D:AC:8F:5E:5D:A7:AF:F6:80:01:16:6D:78:17:B6:29:62:F2:DC:82:5F:DC:3D:7C:B7:B3:4B:61:B9:04:F2:80`를 `apps/delivery-customer/public/.well-known/assetlinks.json`에 반영. 업로드 키 SHA-256이 아니라 앱 서명 키 기준.
- [x] `https://delivery.tacomole.kr/.well-known/assetlinks.json` 운영 배포 및 확인 (2026-05-16): 파일 정상 서빙 확인. `com.tacomole.app` + Play App Signing SHA-256 `6D:AC:...F2:80` 일치.
- [ ] `adb shell pm get-app-links com.tacomole.app` App Links 검증
- [ ] Google 승인 완료 후 관리형 게시에서 공개 테스트 버전 게시
- [ ] USB 실기기 테스트: FCM 토큰 발급 확인, 잠금화면 푸시 수신 확인
- [ ] Vercel 원격 WebView 핫 업데이트 파이프라인 검증

### iOS (배달앱)

- [ ] Xcode → Signing & Capabilities → Associated Domains 추가 (`applinks:delivery.tacomole.kr`)
- [ ] `apple-app-site-association` TEAM_ID 확정 후 운영 배포
- [ ] 시뮬레이터 Universal Link 확인: `xcrun simctl openurl booted "taco://orders/TEST_ID"`
- [ ] Apple Developer Program 등록 (연 129달러)
- [ ] Xcode Archive 빌드 → App Store Connect 앱 등록
- [ ] TestFlight 베타 배포 → 내부 테스터 검증 → App Store 심사 제출

---

## 🔭 인프라 고도화 (추후)

- [ ] **Dev/Prod DB 물리적 분리**: Supabase Dev 인스턴스 별도 생성. Vercel Preview → Dev DB, main branch → Prod DB. GitHub Actions cron도 Dev/Prod 워크플로우 분리.
- [ ] **Vercel Queues 재검토**: consumer를 Vercel 네이티브 queue function으로 분리할 때 재검토.
- [ ] **Sentry Releases 연동**: 배포 시 `sentry-cli releases` GitHub Actions 자동 실행.
- [ ] **Uptime 모니터링**: Better Uptime / UptimeRobot으로 주요 엔드포인트 감시.
- [ ] **Vercel Web Analytics / Speed Insights 도입**: Sentry는 장애·예외 추적용으로 유지하고, `brand-website`, `delivery-customer`, `table-order`에 Vercel Analytics와 Speed Insights를 추가해 페이지뷰, Web Vitals, 배포 후 성능 변화를 수집.
- [ ] **제품 퍼널 분석 도구 검토(PostHog 등)**: 주문 퍼널(QR 진입 → 장바구니 → 주문 완료), 배달 결제 이탈, 창업 문의 전환처럼 이벤트 기반 분석이 필요해질 때 PostHog 도입 여부 검토.
- [ ] **Sentry → Slack/Discord 에러율 알림**: 웹훅 연결.
- [ ] **Queue 실패/백로그 운영 알림**: `QueueEventLog` 기준 FAILED 누적, retry 초과, 오래된 PROCESSING, POS sync 실패 급증 시 Slack/Discord 또는 Sentry alert로 통지.
- [ ] **결제 운영 알림**: Toss 승인 후 로컬 DB 확정 실패, reconcile 실패, pending payment 만료 급증, 관리자 환불 실패를 별도 alert 조건으로 분리.

---

## 🔌 Toss POS 플러그인 (실기기 검증)

- [ ] Toss POS 단말기 연결 후 플러그인 앱 실행 + 최신 코드 충돌 점검
- [ ] `POST /queue/process-once` 수동 trigger → POS 주문 수신 확인
- [ ] POS 전송 실패 케이스 생성 → 관리자 MQ 화면 실패 조회/재시도 확인
- [ ] magic number / 로그 레벨 / 파일 분할 코드 품질 정리 (이슈 #11~17)
- [ ] `Order.source = TOSS_POS` 처리 정책 확정 + 백엔드 수신 → DB 저장 흐름 구현
- [ ] 관리자에서 Toss POS 주문과 배달앱 주문 구분 표시

---

## 🎨 Brand Website

- [x] **매장 페이지 카카오 지도 + 목록 분할 레이아웃** (2026-05-16): `StoreContent.tsx` 전면 재설계. 지도(좌) + 매장 목록(우) 분할 레이아웃(lg 이상). 지도 마커 클릭 → 해당 카드 강조 + 스크롤 이동. 카드 클릭 → 지도 해당 위치로 이동. 매장 카드 "지금 주문하기" → `delivery.tacomole.kr/store/{storeId}/menu`. `NEXT_PUBLIC_KAKAO_MAP_KEY` 없을 때 목록 단독 fallback(로컬 개발). GPS 거리 정렬·검색 유지.
- [ ] 결제 콜백/리다이렉트 URL 환경변수에서 brand-website 경로 정리 (운영 배포 직전 점검)
- [ ] 배포 후 매장 지도 동작 검증 (마커 클릭, 카드 연동, 주문 링크 이동)

---

## 📊 운영 검증 (1차 런칭 전)

- [ ] Toss 테스트 카드 결제 성공: 주문 생성 → 결제 승인 → `PAID` → 주문 상세 갱신
- [ ] Toss 결제 실패/취소: fail 페이지 안내와 재시도 UX 확인
- [ ] 관리자 전액 취소 후 배달앱 주문 상태 갱신 확인
- [ ] 관리자 부분 환불 후 남은 금액/환불 배지 표시 확인
- [ ] 결제 후 POS 전송 큐 처리 + 알림 발송 중복 없는지 확인
- [ ] GitHub Actions cron `POST /queue/process-once` 실제 실행 로그 확인
- [ ] Queue backlog/failed event가 관리자 `/operations`에서 조회·재시도되는지 운영 데이터로 확인
- [ ] Vercel Production/Preview 환경변수 분리 상태 확인 (`REDIS_URL`, Firebase, Toss, Sentry)
- [ ] Lighthouse 점수 90+ 목표 (LCP, CLS, FID 최적화)

---

## 🗓 완료 이력 (마일스톤 요약)

### 2026-05-16 (5차)
- CORS 304 캐시 오염 완전 해소: ETag 비활성화 + `Vary: Origin` + `Cache-Control: no-store` 세 겹 방어 (backend main.ts)
- 브랜드 사이트 CORS 차단 원인 확인 — `tacomole.kr`이 CORS 허용 목록에는 있었으나 delivery 세션의 캐시된 ACAO 헤더 재사용으로 차단. push 후 해소.
- Supabase 운영 DB 누락 마이그레이션 3개 직접 적용: OrderChannel HOMEPAGE 제거, FranchiseInquiry 테이블 생성, _prisma_migrations 동기화
- brand-website E2E 인프라 구축: Playwright `brand-website` 프로젝트(port 3000) + 21개 테스트 (6페이지 커버)
- 카카오 OAuth 정보(이름·전화번호) 배달 정보 입력 폼 자동 완성
- 로그인 sync 타임아웃 25s 확장 + loading 비블로킹 + sync 후 favorite-stores 자동 재시도
- Toss 결제 웹훅 연동: PAYMENT_STATUS_CHANGED / CANCEL_STATUS_CHANGED 처리 (payment AI)
- delivery-customer E2E `/menu` → `/store/store-e2e-1/menu` 경로 수정 (CI 실패 해소)
- brand-website 매장 페이지: 카카오 지도 + 목록 분할 레이아웃. 마커 클릭 → 카드 강조, 카드 클릭 → 지도 이동, "지금 주문하기" → delivery 앱 해당 매장 메뉴 직접 링크

### 2026-05-12
- env sync 스크립트 도입 (`scripts/sync-env.js`, `pnpm sync:env`)
- 실값 env 파일 git untrack + `.gitignore` 보강
- 전체 프로젝트 객관적 평가 및 개선 항목 정리

### 2026-05-07
- Vercel 백엔드 배포 안정화: `vercel.json` 설정 충돌 해소, api/queue 엔트리포인트 분리
- pgmq 타입 불일치(`bigint`→`integer`) 수정, `vitest run` 통과
- Playwright E2E 안정화: admin/delivery/table-order 27 tests 통과
- `@order/shared` 배럴 import 런타임 undefined 대응 (subpath import 전환)
- admin 인증 로딩 race 수정 (profile 동기화 후 loading=false)

### 2026-05-06
- 알림 dedupe key 채널 충돌 수정: `{recipient}:{type}:{subject}:{channel}`
- POS 큐 consumer 흐름 수정: `TOSS_POS`는 polling 유지, `ADMIN_DIRECT`는 `SKIPPED`
- admin E2E 확장: menu.spec, store.spec, operations.spec, orders.spec
- Playwright E2E runner CI 통합

### 2026-05-05
- FCM 푸시 알림 프론트 연동 (배달앱 + 관리자웹)
- Throttler Redis store 도입 (Upstash, 다중 인스턴스 대응)
- admin 직원 호출 Realtime 구독 + `/calls` 페이지
- 매장별 일일 통계 API (`GET /stores/:storeId/stats/daily`) + admin 연결
- Electron admin 앱 초기 구조 (`apps/admin-electron`)

### 2026-05-04
- MQ consumer cron 트리거: GitHub Actions `backend-cron.yml` 5분 주기
- CORS 다중 origin 환경변수 지원 (`FRONTEND_URLS`)
- Capacitor `allowMixedContent` 운영 빌드 차단
- Firebase 백엔드 연동: `UserDevice` 테이블 + `firebase-admin` + FCM 발송

### 2026-05-01 ~ 05-03
- MQ 전체 구현: `pgmq` 큐, `QueueModule`, producer/consumer, retry/backoff, 운영 endpoint
- Toss 카드결제 E2E 통합 테스트: 7 tests (payments-e2e.spec.ts)
- POS 전송 실패 상태 관리 + 관리자 MQ 운영 화면
- `pos.send_order` → POS SDK 전송, 알림 dedupe, `delivery.status_changed` 이벤트
- 런칭 준비도 감사: 주요 결함 6건 식별 및 수정

### ~2026-04-30
- 기본 도메인 구현 완료: 매장/메뉴/주문/결제/세션/인증/테이블오더/배달앱/관리자
- Supabase Auth + JWT, SupabaseGuard, Prisma ORM, Sentry, Helmet, ValidationPipe
- TanStack Query + Zustand, admin 대시보드/주문/메뉴/매장 UI
- Toss Payments 선결제 흐름, 환불/취소 API
- Playwright 도입, table-order/delivery-customer/admin E2E 기반 구축

---

## 🔴 P0 — 보안 (2차 점검, 2026-05-12)

- [ ] **CORS 개발 모드 전체 허용 제거**: `apps/backend/src/main.ts:203` — `NODE_ENV === 'development'` 조건에서 모든 origin을 무조건 허용 중. 개발 환경도 `localhost:3000~3003` 화이트리스트로 제한해야 함. 현재 코드는 개발 서버가 실수로 프로덕션 DB에 연결될 경우 임의 origin에서 인증 쿠키 포함 요청이 가능한 구조.
- [x] **`queue.ts` bootstrap의 `cachedApp: any` 타입 제거** (2026-05-13): `apps/backend/src/queue.ts`에서 `INestApplication | null`로 정리된 상태 확인.

---

## 🟡 P1 — 주요 개선 (2차 점검, 2026-05-12)

### 코드 품질

- [x] **`payments.service.ts` catch 블록 `any` 타입 3건** (2026-05-12): `catch (err/recordError/compensationError: unknown)` + `instanceof Error` 가드로 전환. `errCode`는 `(err as Record<string, unknown>)?.code`로 안전하게 접근.
- [ ] **`table-order` 로컬 타입 `Order` 잔존 — 단일화 보류**: 로컬 `Order`와 shared `Order`는 구조 불일치(items.options: `CartSelectedOption[]` vs `SelectedOption[]` 그룹 구조, storeId/orderId 필드 누락). 강제 통합 시 flat→grouped 변환 로직 + admin OrderReceipt 영향 발생. 로컬 타입이 table-order API 응답에 적합하므로 현 구조 유지.
- [x] **`useOrders.ts` Supabase Realtime filter 정확도** (2026-05-12): Supabase postgres_changes는 단일 컬럼 필터만 지원해 AND 조건 불가. 대신 storeId 폴백 구간에서 콜백 내 `payload.new?.tableNumber !== tableNumber` 체크로 다른 테이블 변경 시 invalidate 건너뜀.

### 테스트

- [ ] **`table-order` 로컬 타입 제거 후 tsc 통과 확인**: `useOrders.ts`의 `Order` import를 `@order/shared`로 교체한 뒤 `pnpm --filter table-order tsc --noEmit` 통과 확인.
- [ ] **`payments.service.ts` 에러 핸들링 단위 테스트 보강**: catch 블록 `unknown` 전환 후, 결제 실패 / 보상 트랜잭션 실패 케이스 spec 추가.
