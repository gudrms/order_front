# 🔧 프론트엔드 수정 필요 항목 (Java → Node)

> **작성일**: 2024-12-28  
> **사유**: Spring Boot → NestJS 전환으로 인한 타입 및 설정 변경

---

## 📋 수정 필요 항목 요약

| 구분         | 현재 (Java/Spring) | 변경 필요 (NestJS/Prisma)      | 우선순위 |
| :----------- | :----------------- | :----------------------------- | :------- |
| **ID 타입**  | `number`           | `string` (UUID)                | 🔴 높음  |
| **API URL**  | `localhost:8080`   | `localhost:4000` (또는 Vercel) | 🔴 높음  |
| **Realtime** | WebSocket (STOMP)  | Supabase Realtime              | 🟡 중간  |
| **환경변수** | WS_URL 등          | Supabase URL/Key 추가          | 🔴 높음  |
| **API 응답** | Spring 표준 응답   | NestJS 표준 응답               | 🟢 낮음  |

---

## 1️⃣ 타입 정의 - ID 타입 변경 (number → string)

### 📁 수정 파일 목록

#### ✅ `src/types/menu.ts`

```typescript
// ❌ 현재
export interface MenuCategory {
  id: number; // ← 수정 필요
  // ...
}

export interface Menu {
  id: number; // ← 수정 필요
  categoryId: number; // ← 수정 필요
  // ...
}

// ✅ 변경 후
export interface MenuCategory {
  id: string; // UUID
  // ...
}

export interface Menu {
  id: string; // UUID
  categoryId: string; // UUID
  // ...
}
```

**수정 대상**:

- `MenuCategory.id`: `number` → `string`
- `Menu.id`: `number` → `string`
- `Menu.categoryId`: `number` → `string`
- `MenuOption.id`: `number` → `string`
- `MenuOptionItem.id`: `number` → `string`

---

#### ✅ `src/types/order.ts`

```typescript
// ❌ 현재
export interface OrderItem {
  id?: number; // ← 수정 필요
  menuId: number; // ← 수정 필요
  // ...
}

export interface Order {
  id: number; // ← 수정 필요
  tableId: number; // ← 수정 필요
  // ...
}

// ✅ 변경 후
export interface OrderItem {
  id?: string; // UUID
  menuId: string; // UUID
  // ...
}

export interface Order {
  id: string; // UUID
  tableId: string; // UUID
  // ...
}
```

**수정 대상**:

- `Order.id`: `number` → `string`
- `Order.tableId`: `number` → `string`
- `OrderItem.id`: `number` → `string`
- `OrderItem.menuId`: `number` → `string`
- `SelectedOption.optionId`: `number` → `string`
- `SelectedOptionItem.optionItemId`: `number` → `string`
- `CreateOrderRequest.tableId`: `number` → `string`
- `CreateOrderRequest.items[].menuId`: `number` → `string`
- `CreateOrderRequest.items[].options[].optionId`: `number` → `string`
- `CreateOrderRequest.items[].options[].optionItemIds[]`: `number[]` → `string[]`

---

#### ✅ `src/types/table.ts`

```typescript
// ❌ 현재
export interface Table {
  id: number; // ← 수정 필요
  number: number; // ← 이건 실제 테이블 번호라서 number 유지
  currentOrderId: number | null; // ← 수정 필요
  // ...
}

// ✅ 변경 후
export interface Table {
  id: string; // UUID
  number: number; // 테이블 번호는 number 유지
  currentOrderId: string | null; // UUID
  // ...
}
```

**수정 대상**:

- `Table.id`: `number` → `string`
- `Table.currentOrderId`: `number | null` → `string | null`

---

#### ✅ `src/types/call.ts`

```typescript
// 파일을 확인하지 못했지만 예상되는 변경사항:
export interface Call {
  id: string; // number → string
  tableId: string; // number → string
  // ...
}
```

---

## 2️⃣ API 엔드포인트 - URL 파라미터 타입 변경

### 📁 `src/lib/api/endpoints/order.ts`

```typescript
// ❌ 현재
export async function getOrdersByTable(tableId: number): Promise<Order[]> {
  return apiClient.get<Order[]>(`/orders/table/${tableId}`);
}

export async function cancelOrder(orderId: number): Promise<Order> {
  return apiClient.post<Order>(`/orders/${orderId}/cancel`);
}

// ✅ 변경 후
export async function getOrdersByTable(tableId: string): Promise<Order[]> {
  return apiClient.get<Order[]>(`/orders/table/${tableId}`);
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return apiClient.post<Order>(`/orders/${orderId}/cancel`);
}
```

---

### 📁 `src/lib/api/endpoints/menu.ts`

```typescript
// ❌ 현재
export async function getCategories(storeId: number): Promise<MenuCategory[]> {
  return apiClient.get<MenuCategory[]>(`/stores/${storeId}/categories`);
}

export async function getMenus(
  storeId: number,
  categoryId?: number
): Promise<Menu[]> {
  const endpoint = categoryId
    ? `/stores/${storeId}/menus?categoryId=${categoryId}`
    : `/stores/${storeId}/menus`;
  return apiClient.get<Menu[]>(endpoint);
}

export async function getMenuDetail(menuId: number): Promise<MenuDetail> {
  return apiClient.get<MenuDetail>(`/menus/${menuId}`);
}

// ✅ 변경 후
export async function getCategories(storeId: string): Promise<MenuCategory[]> {
  return apiClient.get<MenuCategory[]>(`/stores/${storeId}/categories`);
}

export async function getMenus(
  storeId: string,
  categoryId?: string
): Promise<Menu[]> {
  const endpoint = categoryId
    ? `/stores/${storeId}/menus?categoryId=${categoryId}`
    : `/stores/${storeId}/menus`;
  return apiClient.get<Menu[]>(endpoint);
}

export async function getMenuDetail(menuId: string): Promise<MenuDetail> {
  return apiClient.get<MenuDetail>(`/menus/${menuId}`);
}
```

---

## 3️⃣ 환경변수 - Supabase 설정 추가

### 📁 `.env.development`

```bash
# ============================================
# API 서버 설정 (개발)
# ============================================

# ❌ 삭제 또는 주석 처리
# NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
# NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws-stomp

# ✅ 추가
# NestJS Backend (Vercel Serverless 또는 로컬)
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 매장 ID (UUID로 변경됨)
NEXT_PUBLIC_STORE_ID=f336d0bc-b841-465b-8045-024475c079dd

# ============================================
# 개발 도구
# ============================================
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=true
NEXT_PUBLIC_LOG_LEVEL=debug
NODE_ENV=development
```

---

### 📁 `.env.example`

```bash
# ============================================
# 환경 변수 설정 예시
# ============================================

# NestJS Backend
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 매장 ID (UUID)
NEXT_PUBLIC_STORE_ID=your-store-uuid

# 개발 도구
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=true
NEXT_PUBLIC_LOG_LEVEL=debug
NODE_ENV=development
```

---

## 4️⃣ API 클라이언트 - 포트 변경

### 📁 `src/lib/api/client.ts`

```typescript
// ❌ 현재
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// ✅ 변경 후
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
```

---

## 5️⃣ Realtime 설정 - WebSocket → Supabase Realtime

### 📁 `src/lib/supabase.ts` (신규 생성)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

### 📦 패키지 설치 필요

```bash
npm install @supabase/supabase-js
```

---

## 6️⃣ Mock 데이터 - ID 타입 변경

### 📁 `src/mocks/menus.ts`, `src/mocks/categories.ts`

```typescript
// ❌ 현재
export const mockCategories: MenuCategory[] = [
  {
    id: 1, // ← 수정 필요
    name: '파스타',
    // ...
  },
];

// ✅ 변경 후
export const mockCategories: MenuCategory[] = [
  {
    id: 'cat-1-uuid', // UUID 형식 문자열
    name: '파스타',
    // ...
  },
];
```

**또는 실제 UUID 사용**:

```typescript
import { randomUUID } from 'crypto';

export const mockCategories: MenuCategory[] = [
  {
    id: 'f336d0bc-b841-465b-8045-024475c079dd',
    name: '파스타',
    // ...
  },
];
```

---

## 7️⃣ Zustand Store - 타입 변경

### 📁 `src/stores/cartStore.ts`

장바구니 스토어에서 사용하는 타입들도 모두 `string`으로 변경 필요.

```typescript
// 확인 필요 - menuId, tableId 등이 number로 되어 있다면 string으로 변경
```

---

## 📊 작업 우선순위

### 🔴 우선순위 1 (즉시 수정 필요)

1. ✅ `src/types/*.ts` - 모든 ID를 `number` → `string`으로 변경
2. ✅ `src/lib/api/endpoints/*.ts` - 함수 파라미터 타입 변경
3. ✅ `.env.development` - API URL 및 Supabase 설정
4. ✅ `src/lib/api/client.ts` - 기본 URL 포트 변경

### 🟡 우선순위 2 (곧 작업 필요)

5. ✅ Mock 데이터 - UUID 형식 문자열로 변경
6. ✅ `src/lib/supabase.ts` 신규 생성
7. ✅ Zustand Store 타입 검토

### 🟢 우선순위 3 (천천히 작업)

8. ✅ Realtime 기능 구현 (주방 화면 등)
9. ✅ API 응답 구조 확인 및 조정 (필요 시)

---

## 🚀 빠른 작업 가이드

### Step 1: 타입 일괄 변경

```bash
# VSCode에서 Find & Replace (Ctrl + Shift + H)
# 주의: 정규식 사용하여 신중하게 변경!

찾기: id: number
바꾸기: id: string

찾기: Id: number
바꾸기: Id: string
```

### Step 2: 환경변수 업데이트

```bash
# .env.development 수정
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Step 3: 패키지 설치

```bash
npm install @supabase/supabase-js
```

### Step 4: TypeScript 컴파일 확인

```bash
npm run build
# 타입 에러 확인 및 수정
```

---

## ⚠️ 주의사항

1. **number → string 변경 시 주의**:
   - `tableNumber`, `quantity`, `price` 등 실제 숫자 값은 `number` 유지
   - ID 필드만 `string` (UUID)으로 변경

2. **Mock 데이터**:
   - UUID 형식 문자열 사용 권장
   - 예: `'f336d0bc-b841-465b-8045-024475c079dd'`

3. **API 응답 구조**:
   - NestJS도 Spring과 유사한 구조 사용 가능
   - 현재 `ApiResponse<T>` 형식은 유지 가능

4. **환경변수**:
   - `.env.local` 파일은 Git에 커밋하지 말 것
   - Supabase 키는 안전하게 관리

---

## 📝 체크리스트

- [ ] `src/types/menu.ts` ID 타입 변경
- [ ] `src/types/order.ts` ID 타입 변경
- [ ] `src/types/table.ts` ID 타입 변경
- [ ] `src/types/call.ts` ID 타입 변경 (파일 확인 필요)
- [ ] `src/lib/api/endpoints/menu.ts` 파라미터 타입 변경
- [ ] `src/lib/api/endpoints/order.ts` 파라미터 타입 변경
- [ ] `src/lib/api/endpoints/table.ts` 파라미터 타입 변경 (파일 확인 필요)
- [ ] `.env.development` API URL 변경
- [ ] `.env.development` Supabase 설정 추가
- [ ] `.env.example` 업데이트
- [ ] `src/lib/api/client.ts` 기본 URL 변경
- [ ] `src/lib/supabase.ts` 신규 생성
- [ ] `src/mocks/*.ts` Mock 데이터 UUID 변경
- [ ] `src/stores/*.ts` 타입 검토
- [ ] `npm install @supabase/supabase-js`
- [ ] TypeScript 컴파일 에러 확인
- [ ] 테스트 실행 확인

---

> **다음 단계**: 타입 변경 완료 후 백엔드 API 연동 테스트
