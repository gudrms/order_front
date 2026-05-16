# 변경 이력

모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 준수합니다.

---

## [Unreleased]

### Added
- Toss Payments 웹훅 수신 엔드포인트 `POST /payments/toss/webhook` 추가: `PAYMENT_STATUS_CHANGED`, `CANCEL_STATUS_CHANGED` 이벤트를 Toss API 재조회 후 로컬 결제/주문 상태에 반영.
- Toss 결제위젯 키 설정 방어: `delivery-customer` checkout에서 `test_gck_`/`live_gck_` 키가 아니면 위젯을 렌더링하지 않도록 보강.

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
