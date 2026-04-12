# Toss POS Plugin 개발 체크리스트
플러그인 가이드 https://docs.tossplace.com/guide/pos-integration/plugin/develop/develop-tutorial.html

## ✅ 1. 개발 환경 준비 (Toss Place)
- [ ] **개발자 계정 생성**
    - [ ] [Toss Place 개발자 센터](https://place.toss.im/developer) 가입
    - [ ] '내 애플리케이션' 생성 및 `App Key` 발급
- [ ] **테스트 매장 연동**
    - [ ] 개발용 테스트 매장 생성
    - [ ] POS 기기(또는 시뮬레이터)에 테스트 매장 로그인

## ✅ 2. 프로젝트 설정
- [x] **기본 설정**
    - [x] `manifest.json` 설정 파일 생성 (앱 이름, 권한: order, catalog, printer)
    - [x] `package.json` 의존성 확인 (vite, @tossplace/pos-plugin-sdk, @supabase/supabase-js)
    - [x] `tsconfig.json` 브라우저 타겟 설정 (ESNext, bundler)
    - [x] `index.html` 웹앱 진입점 생성
    - [x] `.env` 환경변수 설정 (PLUGIN_ 접두사, Vite import.meta.env)
    - [x] `.gitignore` 추가 (dist/, .env, *.zip)
- [x] **SDK 설치**
    - [x] `@tossplace/pos-plugin-sdk` devDependencies 설치 완료
- [x] **빌드 환경**
    - [x] Vite 번들러 설정 (`vite.config.ts`)
    - [x] Node.js → 브라우저 웹앱 구조로 전환 완료

## ✅ 3. 핵심 기능 구현

### 3-1. 백엔드 통신 (주문 수신)
- [x] **주문 수신 로직 (Hybrid)**
    - [x] **Primary**: Supabase Realtime (`INSERT` 이벤트 구독)
    - [x] **Fallback**: Polling (30초 간격, `GET /api/v1/pos/orders/pending`)
- [x] **주문 상태 동기화**
    - [x] 주문 접수/완료/취소 시 백엔드로 상태 전송 (`PATCH /api/v1/pos/orders/:id/status`)
    - [x] 상태 업데이트 재시도 로직 (3회, exponential backoff)
    - [x] 백엔드 멱등성 처리 (이미 처리된 주문 스킵)
- [x] **중복 처리 방지**
    - [x] `processingOrders` Set으로 Realtime + Polling 동시 처리 차단
- [x] **Realtime 재연결**
    - [x] `CHANNEL_ERROR`/`TIMED_OUT` 시 5초 후 자동 재연결

### 3-2. 프론트엔드 연동 (`apps/table-order`)
- [x] **매장 ID 전송 수정**
    - [x] `StoreContext` 도입하여 URL 기반 매장 UUID 조회
    - [x] 주문 생성 API 호출 시 하드코딩된 ID 대신 실제 UUID 전송

### 3-3. POS 연동 (SDK 활용)
- [x] **주문 등록 (`posPluginSdk.order.add`)**
    - [x] 수신된 주문 데이터를 공식 `PluginOrderDto` 포맷으로 변환 (lineItems, discounts 등)
    - [x] SDK 함수 호출: `await posPluginSdk.order.add(orderDto)`
- [ ] **추가 주문 (`posPluginSdk.order.addMenu`)**
    - [ ] 기존 주문에 메뉴 추가 시 사용
    - [ ] SDK 함수 호출: `await posPluginSdk.order.addMenu(orderId, orderDto)`
- [ ] **주문 완료 (`posPluginSdk.order.complete`)**
    - [ ] 주문 처리 완료 시 호출 (후불 POS 전용)
    - [ ] SDK 함수 호출: `await posPluginSdk.order.complete(orderId)`
- [ ] **주문 조회 (`posPluginSdk.order.getOrders`)**
    - [ ] 필요 시 주문 목록 조회 및 상태 동기화
- [x] **주문 취소 (`posPluginSdk.order.cancel`)**
    - [x] 배달앱 취소 → Supabase UPDATE 감지 → `posPluginSdk.order.cancel()` 호출
- [x] **이벤트 리스너 (`posPluginSdk.order.on`)**
    - [x] `cancel` 이벤트: 토스 POS에서 취소 시 백엔드 상태 동기화

### 3-4. 카탈로그 동기화
- [x] **카탈로그 조회 및 백엔드 전송**
    - [x] 초기 로드 시 `posPluginSdk.catalog.getCatalogs()` → `POST /pos/catalogs/sync` 전송
    - [x] 백엔드에서 카테고리/메뉴/옵션 upsert (tossMenuCode, tossOptionCode 매핑)
- [x] **실시간 카탈로그 변경 감지**
    - [x] `catalog.on('add' | 'update' | 'delete')` → 재동기화 (sold-out/on-sale은 deprecated → update로 대체)
- [x] **주문 시 토스 매핑 ID 포함**
    - [x] `GET /pos/orders/pending` 응답에 `catalogId`, `category`, `tossOptionCode` 포함

### 3-5. 코드 품질
- [x] **파일 분리** (index.ts → config, catalog, order, realtime, types)
- [x] **SDK 타입 직접 사용** (중복 정의 제거, PluginOrderDto 등 SDK에서 import)
- [x] **TS 에러 수정** (PluginCatalogCategory.title, options.choices.priceValue 등)
- [x] **테스트 코드** (vitest, 13개 테스트 통과: order 9, catalog 4)
- [x] **.gitignore** (루트: package-lock.json, swe-worker-*.js 추가)

## ✅ 4. 빌드 및 배포
- [x] **빌드 스크립트**
    - [x] Vite 번들링 (`pnpm build` → `dist/`)
    - [x] zip 압축 스크립트 (`pnpm zip` → `plugin.zip`)
    - [x] 빌드 + 테스트 정상 확인
- [x] **업로드 및 테스트**
    - [x] `pnpm zip`으로 `plugin.zip` 생성 (웹 워커 포맷 최적화)
    - [x] 개발자 센터에 `plugin.zip` 업로드 완료
    - [x] Toss SDK에 배포 완료
    - [ ] '테스트 배포' 후 POS 기기에서 다운로드 및 실행 확인
    - [ ] Realtime 주문 수신 테스트 (Supabase Inspector에서 `pos-orders` 채널 확인)
    - [ ] 카탈로그 동기화 테스트
    - [ ] 주문 취소 양방향 테스트

## ✅ 5. 개발 환경 이슈 해결
- [x] **환경변수 설정**
    - [x] 백엔드 `.env` DB 연결: Supabase Pooler 도메인 DNS 이슈 → IP 직접 연결로 해결 (`3.39.47.126`)
    - [x] `delivery-customer`, `brand-website`, `table-order` 앱 `.env.local` 생성
    - [x] Prisma client 재생성 (`npx prisma generate`) — TS 타입 에러 해결
- [x] **Turbo TUI 이슈**
    - [x] Windows 터미널에서 서비스 선택 불가 → `--ui stream` 또는 `turbo.json`에 `"ui": "stream"` 설정으로 해결
