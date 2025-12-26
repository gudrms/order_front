# 📐 Types

TypeScript 타입 정의 폴더입니다.

## 📁 예정된 타입 파일들

- `menu.ts` - 메뉴 관련 타입
- `order.ts` - 주문 관련 타입
- `cart.ts` - 장바구니 관련 타입
- `api.ts` - API 응답 타입
- `common.ts` - 공통 타입

## 💡 사용 예시

### menu.ts
```tsx
export interface Menu {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isSoldOut: boolean;
  options?: MenuOption[];
}

export interface MenuOption {
  id: string;
  name: string;
  price: number;
  isRequired: boolean;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}
```

### order.ts
```tsx
export type OrderStatus = 'PENDING' | 'COOKING' | 'SERVED' | 'CANCELLED';

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuId: string;
  menuName: string;
  quantity: number;
  price: number;
  options?: string[];
}
```

### api.ts
```tsx
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

## 📝 작성 규칙

1. **네이밍**: PascalCase (예: `Menu`, `OrderStatus`)
2. **인터페이스 vs 타입**: 인터페이스 우선 사용
3. **Export**: 모든 타입 export
4. **재사용**: 공통 타입은 `common.ts`에
5. **주석**: 복잡한 타입에는 JSDoc 주석 추가
