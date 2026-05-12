# 로컬 환경 세팅

## 필수 요구사항

- Node.js 20.x
- pnpm 9.x (`npm install -g pnpm`)

## 1. 환경변수 세팅

이 프로젝트는 루트의 `all-in-one-shared.env.local` 파일 하나를 단일 소스로 사용한다.
Vercel에서는 동일한 `all-in-one-shared.env` 파일을 Shared Environment Variables로 Import한다.

### 최초 세팅

```bash
# 템플릿 복사
cp all-in-one-shared.env.example all-in-one-shared.env.local

# 파일 열어서 실값 채우기 (아래 항목 필수)
# - DATABASE_URL / DIRECT_URL
# - SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY
# - TOSS_ACCESS_KEY / TOSS_ACCESS_SECRET
# - FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL
# - REDIS_URL (옵션 — 없으면 in-memory 폴백)

# 각 앱에 .env.local 생성
pnpm sync:env
```

### 환경변수 수정 후

```bash
# all-in-one-shared.env.local 수정 → 다시 sync
pnpm sync:env
```

### 미리보기 (파일 쓰지 않고 확인만)

```bash
pnpm sync:env:preview
```

### 앱별 생성 위치

`pnpm sync:env` 실행 시 아래 파일들이 자동 생성된다 (gitignore됨).

```
apps/admin/.env.local
apps/backend/.env.local
apps/delivery-customer/.env.local
apps/table-order/.env.local
apps/brand-website/.env.local
```

### 백엔드 DB 연결

로컬 Supabase를 사용할 경우 `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_*` 값을
`pnpm supa:status` 출력값으로 교체한다.

원격 Supabase를 직접 사용할 경우 `.env.local`의 기본값(pooler URL)을 그대로 쓰면 된다.

---

## 2. 의존성 설치

```bash
pnpm install
```

---

## 3. 로컬 Supabase (선택)

```bash
pnpm supa:start    # Docker 기반 로컬 Supabase 시작
pnpm supa:status   # 접속 URL / API Key 확인
pnpm supa:stop     # 종료
```

---

## 4. 개발 서버 실행

```bash
# 전체 (toss-pos-plugin 제외)
pnpm dev

# 앱 단독 실행
pnpm dev --filter=table-order         # localhost:3000
pnpm dev --filter=delivery-customer   # localhost:3001
pnpm dev --filter=brand-website       # localhost:3002
pnpm dev --filter=admin               # localhost:3003
pnpm dev --filter=backend             # localhost:4000

# Toss POS 플러그인 (Vite, 루트 dev에서 제외됨)
pnpm --filter toss-pos-plugin dev     # localhost:5173
```

---

## 5. 유용한 명령어

```bash
pnpm build              # 전체 빌드
pnpm type-check         # TypeScript 타입 검사
pnpm lint               # 린트
pnpm test               # 단위 테스트 (vitest)
pnpm test:e2e           # Playwright E2E
pnpm test:e2e:ui        # Playwright UI 모드

# 앱별 빌드
pnpm --filter backend build
pnpm --filter admin build

# DB
pnpm --filter backend exec prisma studio    # Prisma Studio
pnpm --filter backend exec prisma migrate dev
```

---

## 트러블슈팅

**Windows PowerShell 스크립트 실행 오류**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**`@order/*` 모듈을 찾을 수 없음**
```bash
pnpm install  # 루트에서 재실행
```

**Capacitor 빌드 실패**
```bash
pnpm --filter delivery-customer exec cap sync
```
