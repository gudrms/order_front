# Toss POS Plugin

Toss POS(Toss Place)와 연동하기 위한 플러그인 프로젝트입니다.

## Architecture
This plugin runs on the Toss Place POS device using a **Hybrid Architecture**:
1.  **Realtime (Primary)**: Listens for new orders via Supabase Realtime (WebSocket) for instant feedback.
2.  **Polling (Fallback)**: Checks pending orders every 30 seconds (`GET /api/v1/pos/orders/pending`) to ensure reliability.
3.  **Sync**: Registers orders to POS and updates status via `PATCH /api/v1/pos/orders/:id/status`.

### 빌드
```bash
pnpm build
```
빌드 결과물은 `dist/` 디렉토리에 생성되며, `plugin.zip` 형태로 압축하여 배포합니다.

### 배포 방법
1.  `pnpm build` 실행
2.  생성된 `dist/plugin.zip` 확인
3.  [Toss Place 개발자 센터](https://place.toss.im/developer) 접속
4.  플러그인 업로드 및 심사 요청
