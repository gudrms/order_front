# 🧪 Local Test Guide (로컬 테스트 가이드)

> Backend + Frontend 로컬 환경에서 테스트하는 방법

---

## 📋 사전 준비

### 1. Supabase 프로젝트 생성

1. https://supabase.com 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: table-order-dev
   - **Database Password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: Northeast Asia (Seoul) 선택
4. 생성 완료까지 약 2분 대기

### 2. Database Connection 정보 확인

**Supabase Dashboard → Settings → Database**

1. **Connection String** 섹션에서 다음 정보 복사:
   - **Connection Pooling** (pgBouncer) → `DATABASE_URL`로 사용
   - **Direct Connection** → `DIRECT_URL`로 사용

예시:
```
DATABASE_URL="postgresql://postgres:your-password@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:your-password@db.abcdefghijk.supabase.co:5432/postgres"
```

### 3. Supabase API Keys 확인

**Supabase Dashboard → Settings → API**

- **Project URL**: `SUPABASE_URL`로 사용
- **anon public**: `SUPABASE_ANON_KEY`로 사용
- **service_role**: `SUPABASE_SERVICE_KEY`로 사용

---

## 🚀 Step 1: Backend 환경 설정

### 1-1. .env 파일 생성

```bash
cd apps/backend
cp .env.example .env
```

### 1-2. .env 파일 편집

위에서 확인한 정보로 `.env` 파일을 수정:

```env
DATABASE_URL="postgresql://postgres:your-actual-password@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:your-actual-password@db.abcdefghijk.supabase.co:5432/postgres"

SUPABASE_URL="https://abcdefghijk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.실제키..."
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.실제키..."

Toss 오더_API_KEY=""
Toss 오더_BASE_URL="https://dum.toss-order.co.kr/api"

NODE_ENV=development
```

---

## 🚀 Step 2: Database 스키마 생성

### 2-1. Prisma 설치 확인

```bash
cd apps/backend
npm install
```

### 2-2. Migration 실행

```bash
# DB에 스키마 적용
npx prisma migrate dev --name init

# ✅ 성공 시 출력 예시:
# Your database is now in sync with your schema.
# ✔ Generated Prisma Client
```

### 2-3. Prisma Studio로 DB 확인 (선택)

```bash
npx prisma studio
```

브라우저에서 http://localhost:5555 열림 → 테이블 확인

---

## 🚀 Step 3: Seed Data 추가 (테스트용 데이터)

### 3-1. Seed 파일 확인

`apps/backend/prisma/seed.ts` 파일이 있는지 확인

### 3-2. Seed 실행

```bash
npx prisma db seed
```

**예상 결과**: 테스트용 매장, 메뉴, 카테고리 데이터가 DB에 추가됨

---

## 🚀 Step 4: Backend 서버 실행

### 4-1. 개발 서버 시작

```bash
cd apps/backend
npm run start:dev
```

**✅ 성공 시 출력:**
```
[Nest] 12345  - 2024/12/29, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 2024/12/29, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
...
Application is running on: http://localhost:3001
```

### 4-2. API 테스트

새 터미널을 열어서:

```bash
# 매장 조회
curl http://localhost:3001/api/v1/stores

# 메뉴 조회 (storeId는 실제 생성된 ID로 변경)
curl http://localhost:3001/api/v1/stores/{storeId}/menus
```

**✅ 성공 시**: JSON 응답 확인

---

## 🚀 Step 5: Frontend 설정 및 실행

### 5-1. .env.local 수정

`apps/frontend/.env.local` 또는 루트의 `.env.local` 파일:

```env
# Mock 모드 비활성화
NEXT_PUBLIC_USE_MOCK=false

# Store ID (Prisma Studio나 API 응답에서 확인한 실제 UUID)
NEXT_PUBLIC_STORE_ID=실제-스토어-UUID

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5-2. Frontend 서버 실행

```bash
cd apps/frontend
npm run dev
```

**✅ 성공 시**:
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
```

---

## 🧪 Step 6: 통합 테스트

### 6-1. 브라우저에서 테스트

1. **메뉴 조회**: http://localhost:3000 접속
   - ✅ 메뉴가 로딩되는지 확인
   - ❌ 로딩 안 되면: 브라우저 콘솔 확인 (F12)

2. **장바구니 담기**:
   - 메뉴 클릭 → 옵션 선택 → 장바구니 담기
   - ✅ 장바구니에 추가되는지 확인

3. **주문하기**:
   - 장바구니에서 "주문하기" 클릭
   - ✅ 주문 성공 모달 표시 확인

### 6-2. Database에 주문 저장 확인

**방법 1: Prisma Studio**
```bash
cd apps/backend
npx prisma studio
```
→ `Order`, `OrderItem` 테이블 확인

**방법 2: SQL 쿼리**

Supabase Dashboard → SQL Editor:
```sql
-- 주문 조회
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 5;

-- 주문 상세 조회
SELECT * FROM "OrderItem" ORDER BY "createdAt" DESC LIMIT 10;
```

**✅ 성공 기준**: 주문한 내용이 DB에 저장되어 있음

---

## 🐛 Troubleshooting (문제 해결)

### 1. "Error: P1001: Can't reach database server"

**원인**: DATABASE_URL이 잘못되었거나 Supabase 프로젝트가 일시 중지됨

**해결**:
- .env의 DATABASE_URL 확인
- Supabase Dashboard에서 프로젝트 상태 확인

### 2. "CORS error" (브라우저 콘솔)

**원인**: Backend에서 CORS 설정 누락

**해결**: `apps/backend/src/main.ts` 확인
```typescript
app.enableCors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,
});
```

### 3. "404 Not Found" (API 호출 시)

**원인**: API URL이 잘못되었거나 Backend 서버 미실행

**해결**:
- Backend 서버 실행 확인: http://localhost:3001
- Frontend .env.local의 `NEXT_PUBLIC_API_URL` 확인

### 4. "Prisma Client is not generated"

**해결**:
```bash
cd apps/backend
npx prisma generate
```

### 5. 메뉴가 빈 화면으로 나옴

**원인**: Seed 데이터 미실행 또는 storeId 불일치

**해결**:
1. Seed 실행: `npx prisma db seed`
2. 실제 storeId 확인:
   ```bash
   curl http://localhost:3001/api/v1/stores
   ```
3. `.env.local`의 `NEXT_PUBLIC_STORE_ID` 수정

---

## ✅ 테스트 완료 체크리스트

- [ ] Backend 서버 정상 실행 (http://localhost:3001)
- [ ] Frontend 서버 정상 실행 (http://localhost:3000)
- [ ] 메뉴 조회 성공 (화면에 메뉴 표시)
- [ ] 장바구니 담기 동작
- [ ] 주문 생성 성공 (성공 모달 표시)
- [ ] **Database에 주문 데이터 저장 확인** ✨ (가장 중요!)
- [ ] 주문 내역 조회 (우측 패널)

---

## 📊 Next Steps (다음 단계)

테스트 완료 후:

1. **Admin Dashboard 개발** - 주문 접수 화면
2. **Supabase Realtime 연동** - 실시간 주문 알림
3. **이미지 업로드** - Supabase Storage 연동
4. **Toss 오더 연동** - 실제 POS 시스템 연동 (업체 연락 후)

---

> **Last Updated**: 2024-12-29
> **Test Status**: Ready for Testing
