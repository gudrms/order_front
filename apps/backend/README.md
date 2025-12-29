# Table Order Backend (NestJS)

테이블 오더 시스템의 백엔드 서버입니다. NestJS를 기반으로 하며, Supabase(PostgreSQL)를 데이터베이스로 사용합니다.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (v10)
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Deployment**: Vercel Serverless Functions

## 📂 Project Structure

```
apps/backend/
├── src/
│   ├── modules/          # 기능별 모듈
│   │   ├── menus/        # 메뉴 관리 (조회, 품절 처리)
│   │   ├── orders/       # 주문 처리 (생성, 상태 변경)
│   │   ├── okpos/        # OKPOS 연동
│   │   └── prisma/       # DB 연결 모듈
│   ├── common/           # 공통 유틸리티 (Filters, Interceptors)
│   └── main.ts           # 진입점
├── prisma/
│   └── schema.prisma     # DB 스키마 정의
└── test/                 # E2E 테스트
```

## 💾 Database Schema (Planned)

### 1. Store (매장)
- 매장 기본 정보 관리
- `id`, `name`, `businessNumber` 등

### 2. Menu & Category (메뉴)
- **Category**: 메뉴 카테고리 (`id`, `name`, `sortOrder`)
- **Menu**: 개별 메뉴 항목 (`id`, `name`, `price`, `imageUrl`, `isSoldOut`)
- **MenuOption**: 메뉴별 옵션 (`id`, `name`, `price`)

### 3. Order (주문)
- **Order**: 주문 헤더 (`id`, `tableId`, `totalPrice`, `status`, `paymentStatus`)
- **OrderItem**: 주문 상세 (`menuId`, `quantity`, `options`)

## 🔌 API Endpoints (Draft)

### Menus
- `GET /api/v1/stores/:storeId/menus`: 전체 메뉴 조회 (카테고리 포함)
- `PATCH /api/v1/menus/:menuId/sold-out`: 메뉴 품절 처리

### Orders
- `POST /api/v1/orders`: 주문 생성
- `GET /api/v1/orders/:orderId`: 주문 상세 조회
- `PATCH /api/v1/orders/:orderId/status`: 주문 상태 변경 (접수/완료/취소)

## 🚀 Getting Started

### 1. 환경 변수 설정

`.env` 파일을 생성하고 Supabase 정보를 입력하세요:

**⚠️ IPv4/IPv6 환경에 따른 설정:**

```bash
# 집(IPv4 환경)에서 작업할 때
cp .env.pooler .env

# 회사(IPv6 환경)에서 작업할 때
cp .env.direct .env
```

`.env` 파일 내용:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_KEY="eyJ..."
OKPOS_API_KEY=""
OKPOS_BASE_URL="https://dum.okpos.co.kr/api"
NODE_ENV=development
```

**Supabase 정보 확인 방법:**
- Database URLs: Supabase Dashboard → Settings → Database → Connection String
- API Keys: Supabase Dashboard → Settings → API

### 2. 의존성 설치

```bash
# Backend 디렉토리로 이동
cd apps/backend

# 패키지 설치
npm install

# ⭐ 중요: NestJS CLI 글로벌 설치 (권장)
npm install -g @nestjs/cli
```

**설치 확인:**
```bash
nest --version
# 출력: 10.x.x
```

### 3. Database 스키마 생성

```bash
# Prisma 클라이언트 생성
npx prisma generate

# DB에 스키마 적용
npx prisma migrate dev --name init

# 테스트 데이터 추가 (매장, 메뉴, 카테고리)
npx prisma db seed
```

**성공 확인:**
```bash
# Prisma Studio로 DB 확인
npx prisma studio
# 브라우저에서 http://localhost:5555 열림
```

### 4. 개발 서버 실행

```bash
# 개발 모드로 시작 (Hot Reload 활성화)
npm run start:dev
```

**성공 시 출력:**
```
[Nest] 12345  - LOG [NestFactory] Starting Nest application...
[Nest] 12345  - LOG [InstanceLoader] AppModule dependencies initialized
Application is running on: http://localhost:3001
```

### 5. API 테스트

```bash
# 새 터미널에서 테스트
curl http://localhost:3001/api/v1/stores

# 메뉴 조회 (storeId는 Prisma Studio나 위 응답에서 확인)
curl http://localhost:3001/api/v1/stores/{storeId}/menus
```

## 🐛 Troubleshooting

### "nest: command not found" 오류

**원인**: NestJS CLI가 설치되지 않음

**해결 방법 1 - 글로벌 설치 (권장):**
```bash
npm install -g @nestjs/cli
```

**해결 방법 2 - npx 사용:**
```bash
# package.json 수정
"start:dev": "npx nest start --watch"
```

### "Error: P1001: Can't reach database server"

**원인**: DATABASE_URL이 잘못되었거나 비밀번호 미입력

**해결:**
1. `.env` 파일의 `[YOUR-PASSWORD]`를 실제 비밀번호로 교체
2. Supabase Dashboard에서 프로젝트 일시중지 여부 확인

### "Prisma Client is not generated"

**해결:**
```bash
npx prisma generate
```

### CORS 오류 (Frontend 연결 시)

**확인:** `src/main.ts`에 CORS 설정이 있는지 확인
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

## 📊 Available Scripts

```bash
# 개발 서버 실행 (Hot Reload)
npm run start:dev

# 프로덕션 빌드
npm run build

# 프로덕션 모드로 실행
npm run start

# Prisma Studio 열기
npx prisma studio

# DB 스키마 리셋 (주의: 모든 데이터 삭제)
npx prisma migrate reset
```
