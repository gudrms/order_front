# Taco Mono 작업 현황

마지막 업데이트: 2026-05-16 (3차)

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

- [x] **배달앱 매장 선택 흐름 구현** (2026-05-16): `StoreContext`를 env var 고정(`NEXT_PUBLIC_STORE_ID`) 방식에서 사용자 선택 + localStorage 영속 방식으로 전면 교체. 홈 화면을 전체 재작성 — `getAllStores()` 조회 후 `isDeliveryEnabled && isActive` 필터, 이름/주소 검색, `StoreCard` 컴포넌트(배달비·최소 주문금액·예상시간 표시). 선택한 매장은 `delivery.selectedStore` 키로 localStorage 저장, 앱 재진입 시 복원. 메뉴 페이지 guard도 `error` 제거 → `!store` 시 `/`로 replace.
- [x] **매장 즐겨찾기 (DB 기반)** (2026-05-16): `UserFavoriteStore` Prisma 모델 추가 + migration SQL 생성 및 Supabase 운영 DB 적용. 백엔드 `GET /users/me/favorite-stores` / `POST /users/me/favorite-stores/:storeId/toggle` 엔드포인트 추가. shared `FavoriteStore` 타입 + `getFavoriteStores()` / `toggleFavoriteStore()` API 함수 추가. 배달앱 홈 화면에 하트 버튼(로그인 사용자만 표시) + "즐겨찾기 매장" 섹션(상단 노출). `useFavoriteStores` 훅에 optimistic update 적용.
- [x] **메뉴 이미지 업로드 기능** (2026-05-16): admin 메뉴 등록/수정 시 이미지 URL 직접 입력 → 파일 업로드로 교체. admin에서 클라이언트 압축(`browser-image-compression`, max 1MB/1280px) 후 백엔드 `POST /stores/:storeId/menus/image` 경유, 백엔드 `StorageService`가 `SUPABASE_SERVICE_KEY`로 Supabase Storage 기존 `assets` 버킷의 `menu/{storeId}/{uuid}.ext` 경로에 저장하고 public URL 반환. 권한은 `assertCanManageAdminDirectMenus` 재사용. Vercel 요청 본문 ~4.5MB 제한 때문에 클라 압축 필수.

### 테스트

- [ ] **실 Toss 카드결제 E2E**: `payments-e2e.spec.ts`는 서비스 레이어 mock 한정. 실 HTTP 콜백 / idempotency / 취소 무점검. 실 환경 필요.
- [ ] **테이블오더 첫 주문/추가 주문 E2E**: 브라우저-백엔드 통합 E2E 미작성.
- [ ] **백엔드 미작성 모듈 테스트**: `error-logs`, `sessions`, `integrations/toss`, `menu-detail`, `app.module`.
- [ ] **DB schema `OrderSource.HOMEPAGE` 제거**: migration 영향 검토 후 별도 작업.

### E2E 테스트 커버리지 점검 (2026-05-16)

루트 Playwright 1개로 통합 — 3개 프로젝트(admin :3003, delivery :3001, table-order :3002), `e2e/global-setup.ts` stub 백엔드(:4000). 모든 E2E가 Supabase/백엔드를 mock·stub → 실제 인증·DB·결제 흐름 미검증.

현재 시나리오:
- **admin** (4 spec, ~16 테스트): auth(폼·검증·에러·보호 라우트 7개), menu(ADMIN_DIRECT 생성·TOSS_POS 동기화), orders(상태·환불 1개), store(설정 저장 1개), operations(실패 재시도 1개)
- **delivery-customer** (3 spec, ~33 테스트): 홈/레이아웃, 로그인, 미인증 주문내역, 메뉴 페이지 + 결제 결과 UI 12개(`payment.spec.ts`) + 메뉴→장바구니→결제하기 풀 플로우 11개(`menu-cart.spec.ts`, 2026-05-16 추가)
- **table-order** (1 spec, 3 테스트): QR 진입만 (잘못된 번호·0번·유효 리다이렉트). vitest 설정만 있고 테스트 0개
- **brand-website**: E2E 없음 (Playwright 프로젝트 제외)
- **backend**: 진짜 E2E 없음. `payments-e2e.spec.ts`는 이름만 e2e (Toss mock 통합)

배포 전 우선순위로 채울 시나리오:
- [ ] **table-order 주문 플로우 E2E**: QR→메뉴 선택→장바구니→주문→결제→추적. 제품 핵심인데 현재 0.
- [x] **delivery-customer 결제 결과 페이지 E2E** (2026-05-16, `payment.spec.ts`): 성공 페이지 confirm API mock(로딩·성공·재시도·에러·버튼 네비게이션 7개), 실패 페이지(메시지·버튼 네비게이션·빈 orderId 4개), 체크아웃 빈 장바구니 리다이렉트 1개 — 합계 12 tests 통과.
- [x] **delivery-customer 메뉴→장바구니→결제하기 E2E** (2026-05-16, `menu-cart.spec.ts`): 메뉴 목록·상세 시트·수량 조절·담기(4개), 배지 갱신·최소 주문금액 안내(3개), 장바구니 시트 아이템·닫기(2개), 배달 정보 입력→체크아웃 이동·주문 내역 확인(2개) — 합계 11 tests 통과.
- [ ] **delivery-customer OAuth 로그인 후 실결제 플로우**: 로그인 세션 시뮬레이션, 주문 추적, 마이페이지. (TossPayments 위젯 외부 SDK는 계속 범위 외)
- [ ] **admin 메뉴 이미지 업로드 E2E**: 2026-05-16 추가 기능. 회귀 방지용 — 파일 선택→압축→업로드→URL 저장 시나리오.
- [ ] **admin 미커버 플로우 E2E**: 옵션 그룹 CRUD, 직원 호출 실시간, 가맹 문의 처리.
- [ ] **brand-website E2E 도입**: 랜딩/메뉴쇼케이스/가맹 문의 폼, `/privacy` 접근.
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
- [ ] `https://delivery.tacomole.kr/.well-known/assetlinks.json` 운영 배포 및 placeholder 제거 확인
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

- [ ] Kakao Map 실제 연동 + 운영 키 환경변수 정리
- [ ] 결제 콜백/리다이렉트 URL 환경변수에서 brand-website 경로 정리 (운영 배포 직전 점검)
- [ ] 배포 후 매장 지도 동작 검증

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
