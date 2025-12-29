# Supabase 로컬 개발 가이드 (Local Development Guide)

이 프로젝트는 **Supabase Docker**를 이용한 로컬 개발 환경을 지원합니다.

## 1. 사전 준비 (Prerequisites)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치 및 실행 필수

## 2. 로컬 서버 시작 및 종료
`root` 폴더에서 아래 명령어를 실행하세요.

```bash
# 로컬 Supabase 서버 시작 (Docker 컨테이너 실행)
npm run supa:start

# 로컬 Supabase 서버 중지
npm run supa:stop

# 현재 상태 확인
npm run supa:status
```

> **성공 시 출력되는 정보**를 꼭 확인하세요! (`API URL`, `Anon Key`, `Service Role Key` 등이 출력됩니다)

## 3. 환경 변수 설정 (.env.local)
로컬 서버가 켜지면 출력된 URL과 Key를 `apps/frontend/.env.local`에 복사해야 로컬 환경과 연결됩니다.

```env
# apps/frontend/.env.local 예시
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 4. 운영 데이터 가져오기 (Data Sync)
운영 서버(Production)의 데이터를 로컬로 가져와서 테스트하고 싶을 때 사용합니다.

```bash
# 1. 운영 DB 접속 정보(Connection String)를 준비하세요.
# 2. 아래 명령어를 실행하여 데이터를 가져옵니다. (Windows Powershell 예시)
npx supabase db dump --db-url "postgres://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres" --data-only > supabase/seed.sql

# 3. 로컬 서버 재시작 (데이터 적용)
npm run supa:stop
npm run supa:start
```

> **주의**: `supabase/seed.sql` 파일에는 실제 고객 데이터가 포함될 수 있으므로, **절대로 Git에 커밋하지 마세요.** (`.gitignore` 확인)
