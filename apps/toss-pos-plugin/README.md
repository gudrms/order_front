# Toss POS Plugin

토스 POS(Toss Place) 디바이스에서 실행되는 웹앱 플러그인입니다.
배달앱 주문을 토스 POS에 자동 등록하고, 카탈로그 동기화 및 주문 취소를 양방향으로 처리합니다.

## 구조

```
src/
├── index.ts      # 초기화 (카탈로그 sync, realtime, polling, 이벤트 바인딩)
├── config.ts     # 환경변수, Supabase 클라이언트
├── catalog.ts    # 토스 POS 카탈로그 → 백엔드 동기화
├── order.ts      # 주문 처리, 상태 업데이트 (재시도/중복방지), 폴링
├── realtime.ts   # Supabase Realtime 구독 (INSERT/UPDATE), 재연결
├── types.ts      # 백엔드 API 응답 타입 (SDK 타입은 @tossplace/pos-plugin-sdk에서 import)
└── __tests__/    # vitest 테스트
```

## 동작 흐름

### 주문 등록
```
배달앱 주문 → Supabase DB INSERT → 플러그인 Realtime 감지
→ posPluginSdk.order.add() → 토스 POS에 주문 표시
→ 백엔드 상태 CONFIRMED 업데이트
```

### 주문 취소 (양방향)
- **배달앱 → 토스 POS**: Supabase UPDATE 감지 → `posPluginSdk.order.cancel()`
- **토스 POS → 백엔드**: `order.on('cancel')` → 백엔드 상태 CANCELLED 업데이트

### 카탈로그 동기화
```
토스 POS 상품 → posPluginSdk.catalog.getCatalogs()
→ POST /pos/catalogs/sync → 백엔드 DB에 매핑 저장
→ 주문 시 tossMenuCode/tossOptionCode로 SDK DTO 생성
```

## 환경변수 (.env)

```
PLUGIN_API_URL=http://localhost:4000/api/v1
PLUGIN_SUPABASE_URL=https://xxx.supabase.co
PLUGIN_SUPABASE_ANON_KEY=sb_xxx
PLUGIN_STORE_ID=store-1
```

Vite `import.meta.env`로 로드됩니다 (`PLUGIN_` 접두사 필수).

## 스크립트

```bash
pnpm dev       # 개발 서버 (Vite)
pnpm build     # 프로덕션 빌드 → dist/
pnpm zip       # 빌드 + dist/ 압축 → plugin.zip
pnpm test      # vitest 실행
pnpm preview   # 빌드 결과물 미리보기
```

## 배포

1. `pnpm zip` 실행 → `plugin.zip` 생성
2. [Toss Place 개발자 센터](https://place.toss.im/developer) 접속
3. 플러그인 번들 업로드 → **Toss SDK 배포 완료**
4. 테스트 매장 연결 후 POS 기기에서 확인

## 테스트 방법

### 유닛 테스트
```bash
pnpm test    # vitest 13개 테스트 (order 9, catalog 4)
```

### 실기기 테스트 (POS 기기 필요)
1. 개발자센터에서 테스트 매장 연결
2. POS 기기에서 플러그인 활성화
3. Supabase `Order` 테이블에 테스트 주문 INSERT → POS 주문 표시 확인

### 간접 검증 (POS 기기 없이)
- **Supabase Dashboard > Realtime Inspector**: `pos-orders` 채널 구독 상태 확인
- **백엔드 로그**: `/pos/orders/pending`, `/pos/catalogs/sync` API 호출 확인
- **Supabase Logs**: Realtime 연결/구독 이벤트 확인

## 개발 환경 참고

- **DB 연결**: Supabase Pooler 도메인 DNS 이슈 시 IP 직접 연결 사용 (`3.39.47.126`)
- **Turbo TUI**: Windows에서 서비스 선택 불가 시 `--ui stream` 옵션 사용

## 빌드 결과물 (dist/)

웹 워커(Web Worker) 실행 환경 규격에 맞추어 `iife` 포맷의 단일 JS 파일로 빌드됩니다.
(화면이 없는 백그라운드 구동 방식이므로 `index.html` 및 `manifest.json`은 번들에 포함되지 않으며, 요구 권한 등 메타정보는 토스 플레이스 개발자 센터 화면에서 직접 설정합니다.)

```
dist/
└── main.js       # 플러그인 웹 워커 진입점 번들
```
