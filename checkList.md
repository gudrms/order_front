# Taco Mono 작업 현황

마지막 업데이트: 2026-05-12

---

## 🔴 P0 — 즉시 조치 (보안/치명 버그)

### 보안

- [x] **env sync 체계 도입** (2026-05-12): `scripts/sync-env.js` + `pnpm sync:env`. 루트 `all-in-one-shared.env.local` 단일 소스 → 앱별 `.env.local` 자동 생성.
- [x] **실값 env 파일 git untrack** (2026-05-12): `all-in-one-shared.env`, `backend-env.env`, `.env.direct`, `.env.pooler` `git rm --cached` 완료. `.gitignore` 보강.
- [ ] **실 운영 시크릿 rotate**: git 히스토리에 노출된 아래 키들 즉시 재발급 후 `all-in-one-shared.env.local` + Vercel 대시보드 갱신.
  - Supabase DB 비밀번호 + `SUPABASE_SERVICE_KEY` (Supabase 대시보드)
  - `TOSS_ACCESS_KEY` / `TOSS_ACCESS_SECRET` (Toss 콘솔)
  - `INTERNAL_JOB_SECRET` → 32자 이상 랜덤값으로 교체
  - Gmail 앱 비밀번호 `EMAIL_PASS` (Google 계정 설정)
  - **`SUPABASE_SERVICE_KEY`는 `all-in-one-shared.env.local`에 별도 추가 필요** (기존 파일에 누락)
- [x] **git 히스토리에서 시크릿 완전 제거** (2026-05-12): `python3 -m git_filter_repo`로 4개 env 파일 히스토리 완전 제거 (304개 커밋 재작성). `git push --force origin master` 완료.
- [ ] **CORS 개발 모드 전체 허용 제거**: `apps/backend/src/main.ts:203` — `NODE_ENV=development` 시 모든 origin 허용 + `credentials:true` 조합. 개발도 localhost 화이트리스트로 제한.

### 치명 버그

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

### 테스트

- [ ] **실 Toss 카드결제 E2E**: `payments-e2e.spec.ts`는 서비스 레이어 mock 한정. 실 HTTP 콜백 / idempotency / 취소 무점검. 실 환경 필요.
- [ ] **테이블오더 첫 주문/추가 주문 E2E**: 브라우저-백엔드 통합 E2E 미작성.
- [ ] **백엔드 미작성 모듈 테스트**: `error-logs`, `sessions`, `integrations/toss`, `menu-detail`, `app.module`.
- [ ] **DB schema `OrderSource.HOMEPAGE` 제거**: migration 영향 검토 후 별도 작업.

---

## 🟢 P2 — 점진 개선

### 코드 품질

- [ ] **`any` 타입 제거**: `apps/backend/src` 기준 103건 남음(2026-05-12 확인). Prisma 트랜잭션 타입(`Prisma.TransactionClient`)과 Enum 타입 명시. 특히 `prepareOrderItems(tx: any)`, `updateOrderStatus(..., status: any)`.
- [ ] **`table-order` 폴링 → Realtime 교체**: `apps/table-order/src/hooks/queries/useOrders.ts` `refetchInterval: 5000`. admin은 Supabase Realtime 사용 중. `table-order`도 Realtime 또는 SSE 교체 검토.
- [x] **`table-order` 로컬 API 레이어 정리** (2026-05-12): `apps/table-order/src/lib/api/index.ts`에서 `@order/shared` API를 기본으로 사용하고, table-order 전용 주문 분기만 `lib/api/endpoints/order.ts`에 유지.
- [x] **`useCreateOrder` queryKey 범위 축소** (2026-05-12): 주문 생성 후 `['orders', 'table', storeId, variables.tableNumber]`만 무효화하도록 반영.
- [ ] **프론트엔드 단위 테스트 도입**: `apps/admin`, `apps/delivery-customer`, `apps/table-order` 단위 테스트 없음. 핵심 store/hook(`useCartStore`, `useOrderStatus` 등)부터 vitest + RTL.
- [x] **`packages/order-core` 비즈니스 로직 실제 구현 확장** (2026-05-12): 주문 합계, 배달비, 할인, 매장 정책, 품절/재고/옵션 검증과 `useCartStore` 책임을 `@order/order-core`에 정리.

### 문서 (README/내부)

- [x] **`packages/shared/README.md` 전면 업데이트** (2026-05-12): 공통 타입/API/hook/util과 `@order/order-core` 책임 경계를 실제 구조 기준으로 재작성.
- [x] **`packages/ui/README.md` 내용 보강** (2026-05-12): 실제 컴포넌트 목록, UI 기술 스택, `@order/ui/payment` 서브패스 dynamic import 방식을 추가.
- [x] **`packages/order-core/README.md` 사용 예시 추가** (2026-05-12): 주문 합계/검증, `useCartStore` 예시와 `@order/shared` 책임 경계를 추가.
- [x] **`apps/table-order/src/` 내부 README 재작성** (2026-05-12): `features/`, `hooks/`, `lib/`, `stores/`, `types/` README를 실제 파일 구조 기준으로 교체.
- [x] **운영자 인수인계 문서 작성** (2026-05-12): `docs/operator-handoff.md`에 장애 대응, 운영 엔드포인트, cron 확인, Android 앱 지문/키 기준을 정리.

---

## 📱 앱 배포 (출시 전 완료)

### Android (배달앱)

- [ ] 릴리즈 keystore 신규 발급: 현재 keystore 파일이 없는 상태이므로 새 release keystore 생성 후 안전한 저장소에 백업. key password/store password 분리 보관.
- [x] 기존 전달 SHA-256 지문 참고값 기록 (2026-05-12): `6D:AC:8F:5E:5D:A7:AF:F6:80:01:16:6D:78:17:B6:29:62:F2:DC:82:5F:DC:3D:7C:B7:B3:4B:61:B9:04:F2:80`. 지문은 공개 식별자라 문서 기록 가능. 단, keystore가 없으면 이 지문으로 앱 서명 불가.
- [ ] 신규 keystore 또는 Play App Signing 기준 SHA-256 확정 후 `assetlinks.json` 교체 및 `https://delivery.tacomole.kr/.well-known/assetlinks.json` 운영 배포
- [ ] `adb shell pm get-app-links com.taco.delivery` App Links 검증
- [ ] `capacitor.config.ts` appId `com.taco.delivery` 확정
- [ ] `android/app/build.gradle` versionCode/versionName 설정
- [ ] 릴리즈 `.aab` 빌드: `./gradlew bundleRelease`
- [ ] USB 실기기 `npx cap run android` 실행 + FCM 토큰 발급 확인
- [ ] 앱 종료 후 잠금화면 FCM 푸시 수신 확인
- [ ] PWA `manifest.screenshots` 추가 (Play Store 등록 시 필요)
- [ ] Google Play Console 계정 등록 (개발자 계정 25달러)
- [ ] Play Console 내부 테스트 트랙 업로드 → 심사
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
- [ ] **Vercel Analytics / PostHog**: 기본 이벤트 트래킹 설정.
- [ ] **Sentry → Slack/Discord 에러율 알림**: 웹훅 연결.

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
