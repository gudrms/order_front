# 🚀 Quick Test Guide (빠른 테스트 가이드)

> **목표**: Backend와 DB 연결해서 주문이 실제로 저장되는지 확인하기

---

## Step 1: Supabase 확인

Prisma 스키마(`apps/backend/prisma/schema.prisma`)에 이미 Supabase 설정이 있습니다:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**필요한 것**: Supabase 프로젝트의 DATABASE_URL

---

## Step 2: Backend .env 파일 만들기

### 방법 1: Supabase 프로젝트가 이미 있는 경우

**`apps/backend/.env` 파일 생성**:

```env
# Supabase Dashboard → Settings → Database → Connection String
DATABASE_URL="postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# Supabase Dashboard → Settings → API
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# OKPOS (나중에)
OKPOS_API_KEY=""
OKPOS_BASE_URL="https://dum.okpos.co.kr/api"

NODE_ENV=development
```

### 방법 2: Supabase 프로젝트가 없는 경우

1. https://supabase.com 접속 → 로그인
2. **New Project** 클릭
3. 입력:
   - Name: `table-order-dev`
   - Database Password: **강력한 비밀번호 설정** (꼭 저장!)
   - Region: **Northeast Asia (Seoul)**
4. 생성 완료 (약 2분)
5. 위의 "방법 1" 참고해서 .env 파일 작성

---

## Step 3: DB 스키마 생성 및 데이터 추가

```bash
# 1. Backend 폴더로 이동
cd apps/backend

# 2. 패키지 설치 (처음 한 번만)
npm install

# 3. DB에 스키마 적용
npx prisma migrate dev --name init

# 4. 테스트 데이터 추가 (매장, 메뉴 등)
npx prisma db seed
```

**✅ 성공 메시지**:
```
Your database is now in sync with your schema.
✔ Generated Prisma Client
```

---

## Step 4: Backend 서버 실행

```bash
cd apps/backend
npm run start:dev
```

**✅ 성공 시**:
```
Application is running on: http://localhost:3001
```

**새 터미널**에서 API 테스트:
```bash
# 매장 목록 조회
curl http://localhost:3001/api/v1/stores

# 응답 예시:
# [{"id":"uuid-1234","name":"타코몰리 김포점",...}]
```

---

## Step 5: Frontend 연결

### 5-1. .env.local 수정

**루트의 `.env.local` 파일** 또는 **`apps/frontend/.env.local`**:

```env
# Mock 모드 끄기
NEXT_PUBLIC_USE_MOCK=false

# 실제 Store ID (위 curl 명령어로 조회한 UUID)
NEXT_PUBLIC_STORE_ID=실제-uuid-여기-입력

# Backend API URL (REST API 호출용)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase 설정 (Realtime 실시간 알림용) ⭐ 필수!
# Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**💡 왜 Frontend에도 Supabase 설정이 필요한가요?**

Admin Dashboard(주방 화면)에서 **실시간 주문 알림**을 받기 위해 필요합니다:
- Backend를 거치지 않고 Supabase Realtime에 직접 구독
- 새 주문이 DB에 INSERT되면 즉시 알림 🔔
- `ANON_KEY`는 공개 키라 Frontend에 노출돼도 안전함

### 5-2. Frontend 실행

```bash
cd apps/frontend
npm run dev
```

브라우저: http://localhost:3000

---

## Step 6: 주문 테스트 (핵심!)

1. **메뉴 선택** → 장바구니 담기
2. **주문하기** 클릭
3. ✅ 주문 성공 모달 표시 확인

### DB에 저장됐는지 확인

**방법 1: Prisma Studio (추천)**

```bash
cd apps/backend
npx prisma studio
```

→ 브라우저 http://localhost:5555 열림
→ `Order`, `OrderItem` 테이블 확인

**방법 2: Supabase Dashboard**

https://supabase.com → 프로젝트 선택 → Table Editor
→ `Order`, `OrderItem` 테이블 확인

**✅ 성공**: 주문 데이터가 DB에 저장되어 있음!

---

## 🐛 문제 해결

### "Can't reach database server"
→ `.env`의 `DATABASE_URL` 확인

### "CORS error"
→ Backend 서버가 실행 중인지 확인 (http://localhost:3001)

### 메뉴가 안 보임
→ Seed 실행했는지 확인: `npx prisma db seed`
→ `NEXT_PUBLIC_STORE_ID`가 실제 Store ID인지 확인

### "Prisma Client is not generated"
→ `npx prisma generate` 실행

---

## ✅ 테스트 완료 체크리스트

- [ ] Backend 서버 실행 (http://localhost:3001)
- [ ] Frontend 서버 실행 (http://localhost:3000)
- [ ] 메뉴 화면에 메뉴 표시됨
- [ ] 장바구니 담기 동작
- [ ] 주문하기 성공 (모달 표시)
- [ ] **DB에 주문 저장 확인** ⭐ (가장 중요!)

---

**다 되면 알려주세요! 다음은 Admin Dashboard 만들기입니다** 🎉
