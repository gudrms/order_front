# @order/shared

Frontend ↔ Backend 공통 패키지

## 📦 포함 내용

### Types
- `Menu`, `MenuCategory`, `MenuOptionGroup` - 메뉴 관련 타입
- `Order`, `OrderItem`, `OrderStatus` - 주문 관련 타입
- `Table`, `TableStatus` - 테이블 관련 타입
- `Store`, `StoreType` - 매장 관련 타입
- `ApiResponse`, `PaginationParams` - API 공통 타입

### Constants
- `ORDER_STATUS_LABEL` - 주문 상태 한글 레이블
- `ORDER_STATUS_COLOR` - 주문 상태 색상 (Tailwind)
- `TABLE_STATUS_LABEL` - 테이블 상태 한글 레이블
- `TABLE_STATUS_COLOR` - 테이블 상태 색상 (Tailwind)

### Utils
- `formatCurrency()` - 통화 포맷팅
- `formatDate()` - 날짜 포맷팅
- `formatRelativeTime()` - 상대 시간 표시
- `formatPhoneNumber()` - 전화번호 포맷팅
- `isValidUUID()` - UUID 검증
- `isValidEmail()` - 이메일 검증
- `isValidPhoneNumber()` - 전화번호 검증

## 📖 사용 방법

### Frontend (Next.js)

```typescript
import { Menu, Order, ORDER_STATUS_LABEL, formatCurrency } from '@order/shared';

const menu: Menu = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: '타코',
  price: 15000,
  // ...
};

console.log(formatCurrency(menu.price)); // "15,000원"
```

### Backend (NestJS)

```typescript
import { CreateOrderRequest, OrderStatus } from '@order/shared';

@Post()
async createOrder(@Body() dto: CreateOrderRequest) {
  // ...
}
```

## ✅ 타입 안전성

모든 ID 필드는 `string` (UUID) 타입을 사용합니다.

```typescript
// ✅ CORRECT
interface Menu {
  id: string;           // UUID
  categoryId: string;   // UUID
}

// ❌ WRONG (기존 방식)
interface Menu {
  id: number;          // Java Long
  categoryId: number;
}
```

## 🔧 개발

```bash
# 타입 체크
cd packages/shared
npm run type-check
```
