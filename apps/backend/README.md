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
`.env` 파일을 생성하고 다음 변수를 설정하세요:
```env
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
SUPABASE_URL="https://..."
SUPABASE_KEY="sb_..."
```

### 2. 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev
```

### 3. Prisma 설정
```bash
# DB 스키마 적용
npx prisma migrate dev
```
