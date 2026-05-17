# 프로젝트 역사 & 의사결정 기록

타코몰리 주문 플랫폼의 개발 흐름과 주요 기술 결정을 시간순으로 정리한 문서입니다.
신규 팀원 온보딩 및 포트폴리오 참고용으로 작성되었습니다.

---

## 1. 프로젝트 시작 (2025-12-26)

멕시칸 프랜차이즈 타코몰리의 테이블오더 시스템을 직접 개발하기로 결정했다. 초기에는 단순한 QR 주문 앱 하나로 시작했으며, Next.js App Router + NestJS 조합을 선택했다. 인프라로는 별도 서버 관리 없이 빠르게 운영할 수 있는 **Vercel Serverless**와 **Supabase**를 택했다. Supabase는 PostgreSQL + Auth + Realtime을 한 번에 제공해 초기 개발 속도를 크게 높여주었다.

---

## 2. 테이블오더 MVP (2025-12-27 ~ 12-31)

메뉴 조회부터 주문 확인까지의 핵심 플로우를 2주 안에 완성했다. 백엔드는 NestJS + Prisma로 스키마를 설계하고 Supabase(PostgreSQL)에 연결했다. 개발 초반 단일 앱 구조로 시작했으나, 어드민·배달앱·브랜드 사이트 등 앱이 늘어날 것을 예상해 곧바로 **Turborepo 모노레포**로 전환했다. 코드 공유와 빌드 캐싱이 주된 이유였다.

---

## 3. 모노레포 구조화 & Vercel 배포 (2026-01-07 ~ 01-12)

`packages/shared`, `packages/order-core`, `packages/ui` 로 공유 레이어를 분리해 앱 간 코드 재사용 체계를 잡았다. 이 시기에 Vercel 배포를 처음 시도했는데 설정 충돌과 빌드 오류로 상당한 시행착오를 겪었다. 결국 `vercel.json` 구조와 모노레포 루트 설정을 명확히 분리하면서 안정화했다. Sentry도 이 시기에 통합해 프로덕션 에러 가시성을 확보했다.

---

## 4. 약 4개월의 공백

프랜차이즈 내부 사정과 기타 사유로 개발이 중단되었다. 이 기간 동안 설계를 재검토하고 런칭 우선순위를 재정비했다.

---

## 5. 결제 / MQ / 인프라 완성 (2026-05-01 ~ 05-07)

런칭을 목표로 핵심 기능을 집중적으로 완성했다.

**메시지 큐**: 주문이 POS로 전달되고 FCM 알림이 발송되는 흐름을 안정적으로 처리하기 위해 **pgmq**를 선택했다. Redis나 외부 MQ 서비스 대신 pgmq를 고른 이유는 이미 사용 중인 Supabase(PostgreSQL) 위에서 동작해 인프라를 추가하지 않아도 되기 때문이다. GitHub Actions Cron(5분 주기)으로 consumer를 트리거하는 방식으로 Vercel Serverless의 상시 실행 제약을 우회했다.

**결제**: Toss Payments 카드 결제를 통합했다. 국내 PG사 중 개발자 경험이 가장 좋고 웹훅 및 SDK 품질이 우수해 선택했다.

**푸시 알림**: Firebase FCM을 백엔드에 연동하고, 배달앱과 어드민 모두에서 실시간 알림을 수신할 수 있도록 구현했다.

---

## 6. 대규모 리팩터링 & 보안 감사 (2026-05-12)

런칭 전 코드 품질과 보안을 전면 점검하는 날을 별도로 잡았다.

가장 급했던 것은 **보안 처리**였다. 실제 시크릿 값이 git 히스토리에 남아 있는 것을 발견해 `git filter-repo` 로 전체 히스토리에서 완전히 제거했다. 이후 env 파일은 git에서 untrack 처리하고 `env-sync` 스크립트로 앱별 동기화를 자동화했다.

코드 품질 측면에서는 500줄이 넘는 두 서비스 파일(`OrdersService`, `QueueConsumerService`)을 각각 3~4개 파일로 분리했다. 단일 책임 원칙을 어긴 상태로 운영하면 버그 추적과 테스트가 어렵다고 판단했기 때문이다. P0 버그로 분류한 `orderNumber` 동시성 문제와 localStorage mock 잔존 코드는 즉시 수정했다.

---

## 7. 배달앱 런칭 준비 & 운영 안정화 (2026-05-16)

**배달앱(Capacitor)**: 웹 앱을 네이티브 앱으로 감싸는 방식으로 **Capacitor Remote WebView**를 선택했다. 별도 React Native 코드베이스를 유지하는 대신 기존 Next.js 앱을 그대로 활용할 수 있어 개발 리소스를 크게 절약할 수 있었다. Android target API 35 대응과 Google Play 스토어 자산을 이 시기에 완성했다. Play Console 업로드 과정에서 기존 versionCode 1 중복 오류가 발생해 Android 앱 버전을 versionCode 2 / versionName 1.0.1로 상향했고, 광고 ID 미사용 선언을 완료한 뒤 공개 테스트 출시 버전을 Google 심사에 제출했다. Google Play App Signing의 앱 서명 키 SHA-256을 확인해 Android App Links용 `assetlinks.json`에도 반영했다.

**메뉴 이미지 업로드**: 어드민에서 메뉴 이미지를 직접 올릴 수 있도록 `browser-image-compression` + Supabase Storage 조합으로 구현했다. 업로드 전 클라이언트 측 압축으로 스토리지 비용과 로딩 속도를 동시에 잡았다.

**매장 선택 흐름**: 처음엔 `StoreContext` + localStorage 방식으로 구현했으나, URL에 매장 정보가 없어 공유·북마크가 불가능하다는 구조적 문제를 발견해 곧바로 **URL 기반 라우팅**으로 재설계했다. 라우트를 `/store/[storeId]/menu`, `/store/[storeId]/order/*` 계층으로 재구성하고, 해당 레이아웃(`/store/[storeId]/layout.tsx`)에서 API로 매장 데이터를 fetch해 하위 페이지에 제공한다. localStorage 의존성을 완전히 제거함으로써 탭 간 상태 충돌, hydration mismatch 위험도 함께 해소했다.

**매장 즐겨찾기**: `UserFavoriteStore` DB 테이블을 추가하고 `GET /users/me/favorite-stores`, `POST /users/me/favorite-stores/:storeId/toggle` 엔드포인트를 구현했다. 프론트에서는 optimistic update로 즉각 반응하고, 로그인 사용자에게만 하트 버튼을 노출한다.

**운영 중 발견한 버그들**:

- *Prisma 클라이언트 미재생성*: `UserFavoriteStore` 모델 추가 후 `prisma generate`를 누락해 런타임에서 `userFavoriteStore is not a function` 오류 발생. 스키마 변경 시 반드시 `prisma generate` → commit을 함께 수행해야 한다.
- *CORS 304 캐시 오염 (1차)*: 같은 브라우저에서 admin → delivery 순서로 접근하면 카테고리 API 응답 캐시에 `Access-Control-Allow-Origin: admin.tacomole.kr`가 남아 delivery에서 CORS 차단. `Vary: Origin` 미들웨어를 모든 응답에 선제 추가해 브라우저·CDN이 origin별로 캐시를 분리하도록 수정했다.
- *CORS 304 캐시 오염 (2차 — 브랜드 사이트)*: `tacomole.kr`(브랜드 사이트)에서 `api.tacomole.kr/api/v1/stores`를 요청하면 ACAO 헤더가 `delivery.tacomole.kr`로 반환되는 문제. fix 배포 전에 브라우저가 delivery 세션의 캐시된 ACAO 헤더를 저장해 두었고, 브랜드 사이트 요청 시 그 오래된 캐시를 재사용한 것. `expressApp.set('etag', false)`(새 오염 방지)에 더해 `Cache-Control: no-store`를 API 응답에 추가해 브라우저가 API 응답을 캐시하지 않도록 강제했다.
- *결제 페이지 404*: `/store/[storeId]/menu/page.tsx`에서 `router.push('order/checkout')`를 상대 경로로 작성해 실제 이동 URL이 `/store/.../menu/order/checkout`가 됨. `/store/${store.id}/order/checkout` 절대 경로로 수정.
- *장바구니 최소주문금액 불일치*: 홈 화면과 checkout은 매장 정책의 `minimumOrderAmount`를 쓰지만, 장바구니 BottomSheet에 `15,000원`이 하드코딩되어 테스트 매장 10원 결제 흐름이 막혔다. 장바구니도 `StoreContext`의 매장 정책을 사용하도록 고치고, `/orders` 전역 라우트는 선택 매장이 없을 때 안내 상태를 보여주도록 빌드 안전성을 보강했다.
- *Supabase 마이그레이션 누락*: `FranchiseInquiry`, `UserFavoriteStore` 테이블과 `OrderChannel` enum 변경이 `_prisma_migrations`에 기록됐지만 Supabase 운영 DB에 실제 적용이 안 된 상태였다. 가맹 문의 폼 제출 시 "table does not exist" 런타임 오류 발생. Supabase MCP로 직접 SQL을 적용하고 `_prisma_migrations`에 수동 등록했다. 향후 스키마 변경 시 `prisma migrate deploy`를 반드시 실행해야 한다.
- *로그인 후 즐겨찾기 401*: sync API 완료 전에 favorites 쿼리가 실행되어 401. `syncSessionUser` 성공 후 `queryClient.invalidateQueries(['favorite-stores'])` 호출로 해소.
- *로그인 sync 타임아웃*: Vercel cold start가 10~15초 걸리는데 기본 타임아웃이 10초라 sync 실패 → loading 블로킹. sync 타임아웃을 25초로 확장하고 loading 상태는 sync 완료를 기다리지 않도록 변경.

**브랜드 사이트 매장 페이지 개편**: 초기에는 카카오 지도를 완전히 제거하고 목록 단독 레이아웃으로 단순화했다. 이후 엽기떡볶이(yupdduk.com) 같은 프랜차이즈 브랜드 사이트 벤치마킹을 통해 지도 기반 매장 찾기 + 주문 연결이 핵심 UX임을 확인했다. 최종적으로 지도(좌) + 목록(우) 분할 레이아웃으로 재설계했다. 마커 클릭 시 해당 카드 강조·스크롤 이동, 카드 클릭 시 지도 위치 이동, "지금 주문하기" 버튼은 `delivery.tacomole.kr/store/{storeId}/menu`로 직접 연결된다. `NEXT_PUBLIC_KAKAO_MAP_KEY` 미설정 시 목록 단독 fallback으로 로컬 개발 환경도 대응한다.

---

## 8. 브랜드 사이트 보강 방향 확정 (2026-05-17)

브랜드 사이트를 보끔당 같은 대형 프랜차이즈 구조로 확장하는 안을 검토했지만, 현재 타코몰리는 인천 중심 약 7개 매장 규모이므로 별도 `/company`, BI, 인테리어 탭을 당장 늘리는 것보다 기존 구현을 보강하는 방향이 더 적합하다고 판단했다. 이에 `docs/brand-website-plan.md`를 새 사이트맵 기획서가 아니라 기존 구조 보강 기획안으로 재작성했다.

홈은 `Hero → 대표 메뉴 → 매장 찾기/주문 CTA → 가맹 섹션` 흐름으로 정리했다. 히어로에는 인천 중심 운영, 7개 매장, 매장별 주문, 가맹 상담 가능이라는 신뢰 지표를 넣었다. 대표 메뉴는 더 이상 하드코딩된 Unsplash 이미지가 아니라 운영 API에서 활성 매장, 카테고리, 판매 중 메뉴를 가져와 표시하며, 메뉴 이미지는 어드민에서 업로드한 Supabase Storage `imageUrl`을 그대로 사용한다. 홈의 매장 CTA도 API의 매장 데이터를 5분 revalidate로 캐시해 보여주고, 각 매장은 `delivery.tacomole.kr/store/{storeId}/menu` 주문 링크로 연결한다.

가맹 영역에서는 근거가 확정되지 않은 `30% 평균 수익률` 문구를 제거했다. 프랜차이즈 사이트에서 수익률과 개설 비용은 문의 전환에 도움이 되지만 법적·신뢰 리스크도 크므로, 검증 전에는 `상담 후 개설 비용 안내`처럼 보수적인 표현을 사용하기로 했다.

---

## 9. 브랜드 메뉴 분리 결정 (2026-05-17)

브랜드 홈페이지 메뉴가 매장별 주문 메뉴에 의존하면, 아직 메뉴가 등록되지 않은 매장이나 POS 동기화 상태에 따라 홈페이지 메뉴가 비어 보일 수 있다. 또한 일반 점주가 전체 브랜드 메뉴를 수정하면 다른 매장과 브랜드 노출에 영향을 주므로 권한 범위가 맞지 않는다.

이에 브랜드 메뉴를 `BrandMenuCategory`/`BrandMenu`로 분리했다. 브랜드 사이트 홈 대표 메뉴와 `/menu` 페이지는 공개 `/brand-menus` API를 사용하고, 수정은 admin의 `브랜드 메뉴` 화면과 ADMIN 전용 API에서만 가능하게 했다. 매장 메뉴는 계속 주문/품절/POS 동기화의 기준으로 유지한다.

---

## 10. 관리자 로그인 개편 & 홈 개편 & Analytics (2026-05-17)

**관리자 로그인 페이지 재설계**: 기존 탭(로그인/회원가입) 구조를 제거하고 `[로그인]` `[회원가입]` 버튼을 나란히 배치했다. 회원가입 클릭 시 비밀번호 확인 필드가 확장되며, 이메일 형식·비밀번호 8자 이상·비밀번호 일치 검증이 API 호출 이전에 클라이언트에서 선행된다.

이메일 인증을 유지하는 방향을 선택했다. Supabase 무료 SMTP 발송 한도(시간당 3건)가 문제였을 뿐 인증 자체는 관리자 도구에 더 적합하기 때문이다. `signUp()` 시 `emailRedirectTo: ${origin}/auth/callback`을 지정하고, admin 앱에 `/auth/callback` 페이지를 신규 생성해 이메일 링크 클릭 → 세션 확인 → `/setup` 이동 흐름을 완성했다. 이메일 발송이 불안정할 경우 Supabase 대시보드에서 커스텀 SMTP(Resend, SendGrid 등)로 교체할 수 있다.

초대코드 구조는 기존 설계를 그대로 유지했다. 매장 생성 시 `inviteCode`가 자동 발급되고, 점주는 `/setup` 단계에서 코드를 입력해 `POST /auth/register`를 통해 OWNER 권한과 매장이 연결된다. 코드는 1회 사용 후 null로 소모된다.

**배달앱 홈 화면 개편**: 동대문엽기떡볶이 앱을 레퍼런스로 삼아 홈 구조를 재설계했다. `HomeHeader`는 주소 바 + 배너 캐러셀(3.5초 자동재생, 포인터 스와이프, 점·번호 인디케이터)로 재작성했다. 배너 이미지는 임시 그라디언트로 처리했으며, 추후 관리자 페이지에서 등록·관리하는 구조로 확장할 예정이다. 홈 바디는 비로그인 CTA 바 → 2열 주문유형 카드(배달/방문포장, 클릭 시 매장 목록으로 스크롤) → 선물하기 배너 → 탭 필터·검색·즐겨찾기·매장 목록 순서로 재구성했다.

**Vercel Web Analytics**: admin, delivery-customer, brand-website, table-order 4개 Next.js 앱의 루트 `layout.tsx`에 `<Analytics />`를 추가했다. Vercel 봇이 자동 생성한 `vercel/install-and-configure-vercel-w-gzuywv` 브랜치는 NestJS Swagger UI에 analytics를 주입하는 방식으로 구현해 방향이 맞지 않아 머지하지 않고 직접 프론트엔드에 적용했다.

**매장 좌표 자동 지오코딩**: 브랜드 사이트 카카오 지도의 마커 정밀도를 높이기 위해 Prisma Store 스키마에 `lat Float?`, `lng Float?`를 추가했다. `stores.service`의 `createStore`·`updateStore`에서 카카오 REST API(`/v2/local/search/address.json`)를 호출해 주소를 좌표로 자동 변환한다. `KAKAO_REST_API_KEY` 환경변수가 없거나 API 실패 시 좌표 없이 저장해 기존 동작을 유지한다.

**E2E 안정화**: 두 가지 CI 실패를 수정했다.
- admin `auth.spec.ts`: 회원가입 탭 추가로 페이지에 '로그인' 텍스트 버튼이 2개 생기면서 Playwright strict mode 위반. `getByRole('button', { name: '로그인' })` → `locator('button[type="submit"]')`으로 교체.
- delivery-customer `payment.spec.ts`: 테스트가 `/order/success|fail|checkout` 등 존재하지 않는 평탄 경로로 탐색해 404. 실제 라우트인 `/store/test-store-e2e/order/...`로 수정하고, `StoreLayout`이 요구하는 `/stores/test-store-e2e` API를 STUB_STORE로 모킹 추가.

---

## 11. 관리자 계정 관리 모델로 전환 결정 (2026-05-17)

10번에서 관리자 로그인에 점주 셀프 회원가입(이메일/비밀번호 + 이메일 인증 + 초대코드)을 붙였으나, Supabase 무료 SMTP의 발송 한도와 도달 불안정 때문에 이메일 인증 플로우가 실질적으로 동작하지 않았다. 인증 메일이 도착하지 않아 로컬에서도 가입을 완료할 수 없는 상태가 반복됐다.

원인을 다시 짚어보니, 타코몰리는 인천 중심 약 7개 매장 규모의 내부 운영 도구다. 점주가 스스로 가입하고 이메일을 인증하는 셀프서비스 모델은 이 규모에 과하다. 비밀번호 초기화·계정 삭제 같은 운영 행위도 결국 마스터가 관여해야 한다.

이에 외부 회원가입을 폐기하고 **마스터(ADMIN)가 admin UI에서 점주 계정을 직접 생성·관리하는 모델**로 전환하기로 결정했다. 마스터가 점주의 실제 이메일을 ID로, 비밀번호와 함께 직접 등록한다. 비밀번호 초기화는 마스터가 새 비밀번호를 직접 입력해 즉시 변경하고, 계정 삭제도 마스터가 수행한다. 이 결정으로 이메일 발송 의존성이 통째로 사라지고, 무인증으로 열려 있던 `POST /auth/register` 보안 구멍도 함께 닫힌다.

기술적으로 Supabase auth 유저의 생성·삭제·비밀번호 변경은 `service_role` 키가 필요한 Admin API 호출이라 브라우저에서 불가능하다. 따라서 백엔드에 ADMIN 전용 `/admin/accounts` 엔드포인트군을 두고(`createUser` 시 `email_confirm: true`), admin UI의 '계정 관리' 화면이 이를 호출하는 구조로 간다. 백엔드는 메뉴 이미지 업로드용으로 이미 `SUPABASE_SERVICE_KEY`를 보유하고 있어 추가 인프라가 필요 없다.

10번에서 작업한 회원가입 모드·이메일 인증(`/auth/callback`)·초대코드 소모 플로우는 이 전환으로 폐기 대상이며, 구현은 다음 작업일(2026-05-18 예정)로 미뤘다.

---

## 12. 관리자 계정 관리 모델 구현 (2026-05-18)

11번 결정에 따라 관리자 웹의 외부 회원가입 경로를 제거했다. 로그인 화면은 이메일과 비밀번호만 받도록 단순화했고, `/auth/callback`과 `/setup` 가입 경로를 삭제했다. 권한 없는 사용자는 초대코드 입력 대신 권한 안내 화면으로 이동한다.

백엔드에서는 무인증 `POST /auth/register`를 제거하고, 초대코드 기반 OWNER 승격 로직을 폐기했다. 대신 `ADMIN` 전용 `/admin/accounts` API를 추가했다. 이 API는 Supabase Admin API와 `SUPABASE_SERVICE_KEY`를 사용해 계정 생성(`email_confirm: true`), 비밀번호 초기화, 계정 삭제를 처리하고, 앱 DB의 `User` 및 `Store.ownerId` 연결을 함께 관리한다.

admin 앱에는 `ADMIN` 전용 `계정 관리` 화면을 추가했다. 마스터 관리자는 이메일, 초기 비밀번호, 이름, 전화번호, 역할, 연결 매장을 입력해 점주 계정을 만들 수 있고, 비밀번호를 직접 초기화하거나 계정을 삭제할 수 있다. 매장 초대코드 재발급 UI와 API는 제거했다. `Store.inviteCode` 컬럼은 운영 DB 마이그레이션이 필요한 스키마 정리 항목이므로 1차 구현에서는 사용 중단 상태로 남겨 두었다.

상세 시나리오는 `docs/admin-account-management-scenario.md`로 분리했고, 기존 테스트 시나리오 문서의 `/setup`·초대코드 흐름은 마스터 계정 관리 흐름으로 갱신했다.

---

## 주요 기술 결정 요약

| 결정 | 선택 | 이유 |
|---|---|---|
| 호스팅 | Vercel Serverless | 서버 관리 불필요, 모노레포 배포 지원, 글로벌 CDN |
| DB / Auth | Supabase | PostgreSQL + Auth + Realtime 통합, 빠른 초기 셋업 |
| 메시지 큐 | pgmq | 기존 Supabase DB 위에서 동작, 추가 인프라 불필요 |
| 네이티브 앱 | Capacitor Remote WebView | 기존 Next.js 코드 재사용, 단일 코드베이스 유지 |
| 모노레포 | Turborepo | 앱 간 코드 공유, 빌드 캐싱, 일관된 린트·테스트 |
| 보안 처리 | git filter-repo | git 히스토리에서 시크릿 완전 제거 (rewrite 필요) |
| 배달앱 매장 라우팅 | URL 기반 `/store/[storeId]/menu` | localStorage는 공유·북마크 불가, URL이 정확한 상태 표현 |
| 매장 즐겨찾기 | DB 테이블 (`UserFavoriteStore`) | 기기 간 동기화 필요, localStorage로는 로그인 연동 불가 |
| 브랜드 사이트 매장 지도 | 카카오 지도 + 목록 분할 | 지도에서 바로 주문 링크 연결 — 브랜드 사이트는 discovery, 실제 주문은 delivery 앱으로 분리 |
| 관리자 계정 생성 | 마스터가 admin UI에서 직접 등록 (셀프 회원가입 폐기) | 7개 매장 규모 내부 도구에 셀프 가입·이메일 인증은 과함. 이메일 발송 의존성·`/auth/register` 보안 구멍 동시 제거 |
| 매장 좌표 | 카카오 REST API 자동 지오코딩 | 주소 입력만으로 좌표 자동 변환. 지도 마커 정밀도 확보, 추가 관리 화면 불필요 |
| Vercel Analytics | 프론트엔드 4개 앱 layout에 직접 추가 | Vercel 봇 브랜치(NestJS Swagger 주입 방식)는 방향 오류. 프론트엔드 앱에 올바르게 적용 |
