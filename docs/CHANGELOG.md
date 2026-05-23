# 변경 이력

모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 준수합니다.

---

## [Unreleased]

### Added
- QStash 통합 크론 배치 API `POST /cron/batch` 추가: DB ping, 활성 매장 메뉴 웜업, 큐 처리, Toss pending 결제 만료, 결제 정합성 보정을 단일 호출로 실행.
- 배달 Android 공개 테스트 운영 메모 추가: Firebase 푸시 활성화 조건, Logcat 필터, 카카오 OAuth 앱 복귀 검증 절차를 배포/인수인계 문서에 정리.
- 배달앱 카카오 OAuth 앱 복귀 진단 로그 추가: `Auth`, `AuthCallback`, `DeepLink` 로그로 callback과 세션 복원 여부를 확인.
- ADMIN 전용 관리자 계정 관리 기능 추가: `/admin/accounts` API와 admin `계정 관리` 화면에서 계정 생성, 비밀번호 초기화, 삭제, 매장 OWNER 연결을 처리.
- 관리자 계정 관리 회귀 테스트 추가: `AdminAccountsService` 단위 테스트와 admin `accounts.spec.ts` E2E.
- 배달 주문 가격 위변조 회귀 테스트 추가: 서버 DB 가격 재계산과 클라이언트 총액 불일치 거부를 고정.
- 관리자 계정 관리 상세 시나리오 문서 `docs/admin-account-management-scenario.md` 추가.
- Toss Payments 웹훅 수신 엔드포인트 `POST /payments/toss/webhook` 추가: `PAYMENT_STATUS_CHANGED`, `CANCEL_STATUS_CHANGED` 이벤트를 Toss API 재조회 후 로컬 결제/주문 상태에 반영.
- Toss 결제위젯 키 설정 방어: `delivery-customer` checkout에서 `test_gck_`/`live_gck_` 키가 아니면 위젯을 렌더링하지 않도록 보강.
- Toss 승인 대기 중 사전 검증 기록: 운영 checkout 키 미설정 방어 동작과 운영 웹훅 URL 200 응답 확인.
- Toss 콘솔 웹훅 `Tacomolly Delivery Payments` 등록 완료.
- 브랜드 사이트 보강 기획안 갱신: 기존 `/brand`, `/menu`, `/store`, `/franchise` 구조를 유지하고 홈/가맹/푸터 중심으로 보강하는 방향으로 정리.
- 브랜드 사이트 홈에 인천 중심 7개 매장 신뢰 지표와 매장 찾기/주문 CTA 섹션 추가.
- 브랜드 사이트 홈 대표 메뉴를 API 메뉴 데이터와 Supabase Storage 이미지 URL 기반으로 표시.
- 브랜드 메뉴 분리: `BrandMenuCategory`/`BrandMenu` 스키마, 공개 `/brand-menus` API, ADMIN 전용 관리 API와 admin `브랜드 메뉴` 화면을 추가.
- 브랜드 메뉴 이미지 업로드: `POST /brand-menus/admin/menus/image`로 Supabase Storage `assets` 버킷(`brand-menu/{uuid}`)에 업로드. 매장 메뉴와 같은 `MenuImageUpload` 컴포넌트 재사용.
- 브랜드 메뉴 admin 관리 보강: 인라인 수정 폼, 메뉴 정렬(`displayOrder`), 카테고리 숨김/노출 토글 및 정렬 편집.
- 타코몰리 매장 7곳(김포·부천·부평·검단풍무·만수구월·루원시티·검단마전)을 `Store` 테이블에 등록. 카카오 REST API 지오코딩으로 좌표 설정.
- brand-website 서체 적용: next/font/google로 한글 Noto Sans KR(본문)과 영문 Outfit(디스플레이)을 self-host(`display: swap`).
- 배달앱 쿼리 전역 에러 토스트: `QueryCache.onError`로 쿼리 실패 시 Capacitor 토스트 안내.
- admin-electron 오프라인 복구 화면(`offline.html`): admin 로드 실패 시 안내 화면 + 5초 주기 자동 재연결.
- admin-electron 영수증 프린터 타겟팅: `get-printers`로 프린터 목록 제공, `deviceName` 지정 무음 출력 + 15초 타임아웃 예외 처리.
- admin-electron 수동 업데이트 IPC(`download-update`/`install-update`)와 업데이트 이벤트 구독을 preload에 노출.

### Changed
- 백엔드 운영 배치를 GitHub Actions scheduled workflow 중심에서 Upstash QStash 단일 스케줄(`CRON_TZ=Asia/Seoul */5 10-23 * * *`) 중심으로 전환하도록 문서화.
- 백엔드 pgmq 소비 경로를 publish 직후 Vercel background wake-up 우선 처리로 보강하고, GitHub Actions 5분 queue cron은 누락 메시지 회수용 fail-safe로 유지.
- 큐 이벤트 소비 시작 시 `QueueEventLog` claim을 먼저 획득하도록 바꿔 중복 메시지와 재시도 경합이 같은 POS/알림 side effect를 동시에 실행할 가능성을 낮춤.
- 백엔드 배포 문서와 env 예시를 Supabase serverless pooler + 낮은 `connection_limit`부터 계측하는 기준으로 갱신.
- 배달앱 네이티브 카카오 OAuth callback을 웹 URL 대신 `taco://auth/callback` 앱 scheme 복귀 흐름으로 보강.
- 배달앱 표시명과 Android/PWA 아이콘을 Play 스토어 등록정보 기준 `타코몰리` 브랜드로 통일.
- 관리자 로그인은 마스터가 생성한 계정의 이메일/비밀번호 로그인만 지원하도록 단순화.
- 관리자/백엔드/전체 흐름 테스트 시나리오를 마스터 직접 계정 관리 모델 기준으로 갱신.
- Toss 일반 결제 웹훅 검증 방식 문서화: `PAYMENT_STATUS_CHANGED`/`CANCEL_STATUS_CHANGED`는 서명 헤더가 아니라 결제 조회 API 재호출로 검증하는 현재 구현을 유지.
- 관리자 Toss 환불은 초기 운영 안정성을 위해 전액 취소만 지원하도록 단순화하고, 부분 환불 요청은 서버에서 거부.
- 브랜드 사이트 가맹 섹션의 미확정 `30% 평균 수익률` 표현을 제거하고 `상담 후 개설 비용 안내`로 완곡 처리.
- 브랜드 사이트 메뉴 API fallback URL을 운영 API(`https://api.tacomole.kr/api/v1`) 기준으로 보정.
- 브랜드 메뉴 `price`를 필수에서 선택값(`Int?`)으로 전환: 대표 메뉴는 매장별 가격이 달라 가격 미입력을 허용. admin·홈페이지 표시도 가격 없을 때 미노출 처리.
- 브랜드 사이트 `/brand` 페이지 Hero·Philosophy 섹션의 이모지 플레이스홀더를 실제 사진으로 교체.
- admin 사이드바에서 동일 라우트(`/franchise-inquiries`)를 가리키던 중복 메뉴('창업 문의')를 제거.
- e2e 빈 로그인 폼 테스트를 HTML5 네이티브 유효성 검증 기준으로 수정.
- 배달앱 매장 클릭 진입 성능 개선: 홈 목록의 store를 상세 캐시에 시드하고 카테고리/메뉴를 prefetch해 전체화면 로딩 워터폴 제거.
- 배달앱 TanStack Query `refetchOnWindowFocus`를 비활성화해 하이브리드 앱 복귀 시 focus storm을 완화.
- 배달앱 장바구니 store 구독을 selector로 분리해 장바구니 변경 시 불필요한 리렌더를 축소.
- 배달앱 메뉴 이미지에 `loading="lazy"`/`decoding="async"`를 적용하고 외부 placeholder 의존을 제거.
- brand-website 매장 찾기 거리 정렬을 `setStores` 사이드이펙트에서 `sortedStores` useMemo 파생으로 전환.
- brand-website Hero 배경을 CSS `bg-[url]` 2880px 원본에서 next/image `fill`+`priority`로 전환(2880→1920, webp/리사이즈 최적화).
- admin-electron 메인 프레임 네비게이션 가드(`will-navigate`)로 허용 origin 밖 이동을 차단하고 외부 브라우저로 연다.
- admin-electron 업데이트를 `autoDownload=false` 수동 승인 방식으로 전환(영업 중 강제 다운로드/재시작 방지).
- admin-electron 트레이 종료를 `win.destroy()`에서 `app.quit()`로 바꿔 프로세스를 완전 해제.
- admin 매장 조회 쿼리를 `enabled:!!authHeaders`로 가드해 토큰 미탑재 상태의 401 경쟁을 방지.
- 백엔드 cold start 원인 분석 기록: 매장/메뉴 첫 로드 ~5초 지연이 Supabase가 아니라 NestJS를 Vercel 서버리스에 올린 구조의 cold start(DI 컨테이너 + Prisma 부팅 2~5초)임을 확인. Vercel은 `min-instances` 노브가 없어 유료(Pro/Fluid Compute)로도 보장 제거 불가. 트래픽이 붙으면 인스턴스 warm 유지로 자연 완화되므로 출시 블로커는 아니나, 근본 해결은 백엔드만 상시 기동 인스턴스(Cloud Run `min-instances=1` 도쿄 등)로 이전(프론트 Next.js는 Vercel 유지). 체크리스트 인프라 고도화/Delivery Customer 항목에 정리.
- GitHub Actions 5분 cron 실행 신뢰성 문제 기록: `backend-cron.yml`이 `*/5` 설정이나 스케줄 스로틀링으로 실제 1~3시간 간격 실행됨을 Actions 로그로 확인. cold start 워밍업 효과가 없을 뿐 아니라 결제 만료/정합성 배치(`/payments/toss/expire-pending`·`/reconcile`)가 지연되는 운영 위험이 있어, 신뢰성 있는 스케줄러로 이전 검토 항목을 체크리스트에 추가.

### Removed
- admin 셀프 회원가입, 이메일 인증 콜백(`/auth/callback`), `/setup` 가입 경로, 무인증 `POST /auth/register`, 매장 초대코드 재발급 UI/API 제거.
- 배달앱 `StoreContext`의 미사용 배달비 헬퍼(`orderTotal`, 정적 `deliveryFee`, `calcDeliveryFee`) 제거. checkout은 `calculateOrderTotals`로 동적 계산.

### Fixed
- 배달앱 전역 에러 토스트 스팸: `QueryCache.onError`가 모든 쿼리 에러에 무차별로 토스트를 띄워, 로그인 상태에서 보조 쿼리(즐겨찾기 등) 실패 시 홈 탭 전환마다 "일시적인 오류" 알림이 반복되던 문제를 `meta.errorToast` opt-in + 캐시 데이터 없음 조건 + 중복 억제로 해소(화면 핵심 쿼리만 알림).
- Firebase Android 설정이 없는 공개 테스트 설치본에서 원격 WebView가 네이티브 Push Notifications 등록을 호출해 시작 직후 종료되던 흐름을 opt-in 푸시 초기화로 차단.
- 배달앱 웹뷰 상단 상태바 겹침: `viewport-fit=cover`와 `safe-area-inset` 패딩을 고정 헤더 전반에 적용해 Android 15 edge-to-edge/iOS 노치에서 핸드폰 상단 정보와 콘텐츠가 겹치던 문제 해소.

---

## [0.6.0] - 2026-05-16

### Added
- 어드민 메뉴 이미지 업로드 (`browser-image-compression` + Supabase Storage)
- 배달앱 홈 화면 매장 선택 흐름 (`StoreContext`, localStorage 유지, 매장 목록 + 검색)
- **매장 즐겨찾기 (DB 기반)**: `UserFavoriteStore` 테이블 + migration, 백엔드 `GET /users/me/favorite-stores` / `POST /users/me/favorite-stores/:storeId/toggle`, 배달앱 홈 하트 버튼 + 즐겨찾기 섹션 (optimistic update)
- Android target API 35 대응, Google Play Console 등록정보 및 스토어 자산 추가, AAB 재빌드
- Android 앱 버전 상향 (`versionCode 2`, `versionName 1.0.1`) 및 공개 테스트 출시 버전 Google 심사 제출
- Play Console 광고 ID 미사용 선언 완료
- Play App Signing 앱 서명 키 SHA-256을 `assetlinks.json`에 반영해 Android App Links 검증 준비
- E2E 테스트 추가: delivery-customer 결제 플로우 (12 tests), 메뉴 → 장바구니 → 결제 플로우 (11 tests)
- `docs/CHANGELOG.md`, `docs/history.md` 프로젝트 이력 문서 신규 작성

### Fixed
- `apiClient` fallback URL을 `localhost` 에서 `https://api.tacomole.kr/api/v1` 로 수정 (운영 환경 오작동 방지)
- Supabase OAuth redirect URL 설정 누락 수정 (`https://*.tacomole.kr/**` 추가, Site URL을 `delivery.tacomole.kr`로 변경)
- 배달앱 장바구니 최소주문금액을 하드코딩 `15,000원`에서 매장별 `minimumOrderAmount` 기준으로 변경
- 배달앱 `/orders` 전역 라우트가 `StoreProvider` 없이 prerender될 때 빌드 실패하던 문제 수정
- 결제 페이지 상대 경로 이동으로 `/store/[storeId]/menu/order/checkout` 404가 발생하던 문제 수정
- API CORS 응답에 `Vary: Origin`을 추가해 여러 프론트 도메인 간 304 캐시 오염 방지
- `UserFavoriteStore` 추가 후 Prisma 클라이언트 미재생성으로 발생하던 런타임 오류 수정

---

## [0.5.0] - 2026-05-12

### Added
- `env-sync` 스크립트: 환경 변수 파일을 앱별로 동기화
- Swagger / Scalar API 문서 UI 적용 (2026-05-09)
- 보안 헤더 구성 (Helmet, CSP) (2026-05-09)
- `SUPABASE_SERVICE_KEY`, `TOSS_PAYMENTS_SECRET_KEY` env 키 공식 추가 (2026-05-13)
- Backend Cron queue 타임아웃 완화 (`--max-time 75`, `quantity:3`) (2026-05-14)
- `CustomThrottlerGuard` Rate Limiting (Redis/Upstash 기반) (2026-05-13)

### Changed
- `OrdersService` 분리: 616줄 단일 파일 → 3개 파일로 책임 분리
- `QueueConsumerService` 분리: 584줄 단일 파일 → 4개 파일로 책임 분리
- `ConfigService` / Joi 검증을 전체 모듈에서 일원화
- `cartStore` 로직을 `order-core` 패키지로 이관
- Realtime 구독 `sessionId` 정밀화로 중복 이벤트 방지
- `QueueAppModule` Serverless cold start 최적화 (불필요한 모듈 로드 제거)
- 주요 문서 갱신: `operator-handoff`, `README`, `architecture`, `notion.md`, 개인정보처리방침

### Fixed
- `updateOrderStatus` 에서 localStorage mock 잔존 코드 제거 (P0 치명 버그)
- `orderNumber` 동시성 충돌 및 상태 전이 검증 누락 수정 (P0)
- Optional → Required 의존성 주입으로 런타임 null 오류 방지
- `table-order` 타입 불일치 정리, API 클라이언트 중복 코드 제거
- `any` 타입 남용 제거 및 `queryKey` 범위 축소

### Security
- 실제 시크릿 값이 포함된 파일을 git untrack 후 `git filter-repo` 로 히스토리에서 완전 제거
- Android keystore 서명 설정 (`build.gradle`) 및 Electron admin 초기 구조 추가

---

## [0.4.0] - 2026-05-01 ~ 2026-05-07

### Added
- pgmq 기반 메시지 큐 전체 구현: `QueueModule`, consumer, retry 전략
- Toss Payments 카드 결제 통합 및 테스트 완료
- GitHub Actions Cron (5분 주기) 으로 MQ consumer 트리거
- Firebase FCM 백엔드 연동 및 프론트 푸시 알림 수신 (배달앱 + 어드민)
- Throttler Redis store (Upstash) 적용
- 어드민 직원 호출 Supabase Realtime 연동
- 매장 일일 통계 API 추가
- Electron 기반 어드민 데스크톱 앱 초기 구조
- Playwright E2E CI 통합 및 어드민 E2E 시나리오 확장
- POS 큐 consumer 흐름 구현

### Changed
- CORS 다중 origin 허용 설정
- Capacitor `allowMixedContent` 활성화 (Android WebView)
- `vercel.json` 충돌 해소, `api/queue` 엔트리 분리로 Vercel 배포 안정화
- pgmq `bigint` → `integer` 타입 변경으로 Supabase 호환성 확보

### Fixed
- 알림 dedupe key 채널 충돌 수정
- Backend Cron 헬스체크 타임아웃 수정 (dynamic import 방식으로 전환)

---

## [0.3.0] - 2026-01-07 ~ 2026-01-12

### Added
- Sentry 에러 모니터링 통합 (백엔드 + 프론트엔드)
- `OrderReceipt` 컴포넌트 구현
- corepack 설정으로 패키지 매니저 버전 고정

### Changed
- 공유 디렉토리 리팩터링: `packages/shared`, `packages/order-core`, `packages/ui` 구조 확립
- `brand-website` (Next.js) 앱 추가

### Fixed
- Vercel 배포 버전 / 설정 오류 수정 (다수 시행착오 후 안정화)
- 빌드 오류 수정 (모노레포 전환 후 발생한 경로·의존성 문제)

---

## [0.2.0] - 2025-12-27 ~ 2025-12-31

### Added
- 테이블오더 MVP: 메뉴 조회 → 장바구니 → 주문 확인 전체 플로우
- Prisma 기반 DB 스키마 설계 및 Supabase 연결
- 메뉴 API, 주문 API 구현 (NestJS)

### Changed
- 단일 앱 구조에서 모노레포(Turborepo)로 전환
- 백엔드 디렉토리 구조 재정비

---

## [0.1.0] - 2025-12-26

### Added
- 모노레포 초기 커밋: `apps/backend`, `apps/table-order` 기본 골격
- PWA 기본 설정 (`manifest.json`, 서비스 워커)
- 환경 변수 구성 (`.env.example`) 및 개발 환경 세팅

---

[Unreleased]: https://github.com/your-org/taco/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/your-org/taco/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/your-org/taco/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/your-org/taco/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/your-org/taco/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/your-org/taco/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/taco/releases/tag/v0.1.0
