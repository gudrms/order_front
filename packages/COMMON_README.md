# Shared Packages (공유 패키지)

이 디렉토리는 모노레포 내 모든 앱에서 공통으로 사용하는 코드와 라이브러리를 포함합니다.

---

## 📦 패키지 구조

```
packages/
├── shared/          # 공통 비즈니스 로직 & 유틸리티
└── ui/             # 공통 UI 컴포넌트
```

---

## 🎯 `packages/shared` - 공통 로직

### 1. API Client (`src/api/`)

**목적**: 백엔드 API 통신 공통 처리

**파일 구조**:
```
src/api/
├── client.ts              # Axios 기반 API 클라이언트
└── endpoints/
    ├── menu.ts            # 메뉴 관련 API
    ├── order.ts           # 주문 관련 API
    └── store.ts           # 매장 관련 API
```

**사용 예시**:
```typescript
import { getMenus, createOrder } from '@order/shared';

// 메뉴 조회
const menus = await getMenus('store-1');

// 주문 생성
const order = await createOrder({
  storeId: 'store-1',
  tableId: 'table-1',
  items: [{ menuId: 'menu-1', quantity: 2 }]
});
```

**특징**:
- ✅ 자동 에러 처리
- ✅ 타입 안전성 (TypeScript)
- ✅ 환경 변수 기반 API URL 설정
- ✅ Mock 데이터 지원 (`NEXT_PUBLIC_USE_MOCK`)

---

### 2. State Management (`src/stores/`)

**목적**: 전역 상태 관리 (Zustand 사용)

**파일**:
- `cartStore.ts` - 장바구니 상태 관리
- `deliveryInfoStore.ts` - 배달 정보 상태 관리

**사용 예시**:
```typescript
import { useCartStore } from '@order/shared';

function CartComponent() {
  const { items, totalPrice, addItem, removeItem, clearCart } = useCartStore();

  return (
    <div>
      <p>총 금액: {totalPrice.toLocaleString()}원</p>
      <button onClick={clearCart}>장바구니 비우기</button>
    </div>
  );
}
```

**특징**:
- ✅ 자동 합계 계산
- ✅ 수량 조절 (증가/감소/삭제)
- ✅ 옵션 가격 포함
- ✅ 최소 주문 금액 검증

---

### 3. Types (`src/types/`)

**목적**: 앱 전체에서 사용하는 공통 타입 정의

**파일 구조**:
```
src/types/
├── index.ts           # 통합 export
├── menu.ts            # 메뉴 관련 타입
├── order.ts           # 주문 관련 타입 (테이블 주문)
├── payment.ts         # 결제 관련 타입 (배달 주문)
├── store.ts           # 매장 관련 타입
├── table.ts           # 테이블 관련 타입
├── call.ts            # 호출 관련 타입
└── api.ts             # API 응답 타입
```

**주요 타입 구조**:

#### 주문 관련 타입
```typescript
// 테이블 주문 생성 요청 (매장 내)
export interface CreateTableOrderRequest {
  tableId: string;
  storeId: string;
  items: {
    menuId: string;
    quantity: number;
    options?: {
      optionGroupId: string;
      optionItemIds: string[];
    }[];
  }[];
}

// 배달/포장 주문 생성 요청 (결제 포함)
export interface CreateDeliveryOrderRequest {
  storeId: string;
  tableId?: string;
  items: PaymentOrderItemInput[];
  totalAmount: number;
  payment: PaymentRequest;
}

// 레거시 호환용 (점진적 마이그레이션)
export type CreateOrderRequest = CreateTableOrderRequest;
export type OrderItemInput = PaymentOrderItemInput;
export type OrderResponse = PaymentOrderResponse;
```

**사용 예시**:
```typescript
import type { Menu, CreateTableOrderRequest } from '@order/shared';

const request: CreateTableOrderRequest = {
  tableId: 'table-1',
  storeId: 'store-1',
  items: [
    { menuId: 'menu-1', quantity: 2 }
  ]
};
```

**타입 네이밍 규칙**:
- `CreateTableOrderRequest` - 테이블 주문 생성
- `CreateDeliveryOrderRequest` - 배달/포장 주문 생성
- `PaymentOrderItemInput` - 결제용 주문 항목
- `PaymentOrderResponse` - 결제 응답

---

### 4. Utilities (`src/utils/`)

**목적**: 재사용 가능한 유틸리티 함수

**파일**:
- `toss-payments.ts` - 토스페이먼츠 SDK 래퍼
- `daum-postcode.ts` - 다음 우편번호 서비스
- `validation.ts` - 유효성 검사 (전화번호, 이메일 등)
- `format.ts` - 포맷팅 (가격, 날짜 등)

**사용 예시**:
```typescript
import { requestPayment, generateOrderId } from '@order/shared';

const orderId = generateOrderId(); // "ORDER_1735123456789_1234"

await requestPayment({
  amount: 15000,
  orderId,
  orderName: '타코몰리 베이직 외 2건',
  customerName: '홍길동',
  successUrl: `${window.location.origin}/order/success`,
  failUrl: `${window.location.origin}/order/fail`,
});
```

**주소 검색**:
```typescript
import { openDaumPostcode } from '@order/shared';

const handleSearchAddress = async () => {
  await openDaumPostcode((data) => {
    const address = data.roadAddress || data.jibunAddress;
    console.log('선택한 주소:', address);
  });
};
```

---

### 5. Supabase Client (`src/lib/supabase.ts`)

**목적**: Supabase 인증 클라이언트 (중앙 관리)

**사용 예시**:
```typescript
import { supabase } from '@order/shared';

// 카카오 로그인
await supabase.auth.signInWithOAuth({
  provider: 'kakao',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
});

// 세션 확인
const { data: { session } } = await supabase.auth.getSession();

// 로그아웃
await supabase.auth.signOut();
```

**특징**:
- ✅ 자동 세션 유지 (`persistSession: true`)
- ✅ 자동 토큰 갱신 (`autoRefreshToken: true`)
- ✅ URL 기반 세션 감지 (`detectSessionInUrl: true`)

---

### 6. React Query Hooks (`src/hooks/`)

**목적**: 서버 상태 관리 (캐싱, 자동 재시도 등)

**파일**:
```
src/hooks/
├── queries/
│   ├── useMenus.ts        # 메뉴 조회
│   ├── useOrders.ts       # 주문 내역 조회
│   └── useStores.ts       # 매장 정보 조회
└── mutations/
    ├── useCreateOrder.ts  # 주문 생성
    └── useUpdateOrder.ts  # 주문 수정
```

**사용 예시**:
```typescript
import { useMenus } from '@order/shared';

function MenuPage() {
  const { data: menus, isLoading, error } = useMenus('store-1');

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <MenuList menus={menus} />;
}
```

---

## 🎨 `packages/ui` - 공통 UI 컴포넌트

**목적**: 재사용 가능한 UI 컴포넌트 (shadcn/ui 기반)

### 컴포넌트 목록

- `Button` - 버튼
- `Input` - 입력 필드
- `Card` - 카드
- `Badge` - 뱃지
- `Sheet` - 바텀시트/사이드시트
- `Dialog` - 모달 다이얼로그
- `Tabs` - 탭

**사용 예시**:
```typescript
import { Button, Card } from '@order/ui';

function MyComponent() {
  return (
    <Card>
      <h2>주문 완료</h2>
      <Button variant="primary">확인</Button>
    </Card>
  );
}
```

---

## 📝 패키지 사용 방법

### 1. 설치 (이미 설정됨)

모노레포 구조이므로 별도 설치 불필요. 각 앱의 `package.json`에 이미 추가되어 있습니다:

```json
{
  "dependencies": {
    "@order/shared": "workspace:*",
    "@order/ui": "workspace:*"
  }
}
```

### 2. Import

```typescript
// shared 패키지에서 import
import {
  useCartStore,
  getMenus,
  createOrder,
  type Menu,
  type CreateTableOrderRequest
} from '@order/shared';

// ui 패키지에서 import
import { Button, Card, Input } from '@order/ui';
```

### 3. 개발 시 주의사항

**패키지 수정 후 재빌드**:
```bash
# shared 패키지 수정 시
cd packages/shared
pnpm build

# 또는 루트에서 전체 빌드
pnpm build
```

**Hot Reload**: Turborepo가 자동으로 의존성 변경을 감지하지만, 때로는 수동 재시작이 필요합니다.

---

## 🔧 환경 변수 관리

**중요**: 환경 변수는 앱별 `.env.local` 파일에서 관리합니다.

### 필수 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_STORE_ID=store-1

# 토스페이먼츠 결제위젯
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_xxx

# Mock 데이터 사용 여부
NEXT_PUBLIC_USE_MOCK=true
```

**자세한 내용**: 루트의 `ENV_MANAGEMENT.md` 참고

---

## 🚀 새 기능 추가하기

### 1. API Endpoint 추가

**packages/shared/src/api/endpoints/menu.ts**:
```typescript
export async function getMenuById(menuId: string): Promise<Menu> {
  return apiClient.get<Menu>(`/menus/${menuId}`);
}
```

**사용**:
```typescript
import { getMenuById } from '@order/shared';

const menu = await getMenuById('menu-1');
```

### 2. 새로운 Store 추가

**packages/shared/src/stores/favoriteStore.ts**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteState {
  favorites: string[];
  addFavorite: (menuId: string) => void;
  removeFavorite: (menuId: string) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set) => ({
      favorites: [],
      addFavorite: (menuId) =>
        set((state) => ({
          favorites: [...state.favorites, menuId],
        })),
      removeFavorite: (menuId) =>
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== menuId),
        })),
    }),
    { name: 'favorite-storage' }
  )
);
```

**Export**: `packages/shared/src/index.ts`에 추가
```typescript
export * from './stores/favoriteStore';
```

### 3. 타입 추가

**packages/shared/src/types/review.ts**:
```typescript
export interface Review {
  id: string;
  menuId: string;
  userId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface CreateReviewRequest {
  menuId: string;
  rating: number;
  comment: string;
  images?: File[];
}
```

**Export**: `packages/shared/src/types/index.ts`에 추가
```typescript
export * from './review';
```

---

## 🐛 문제 해결

### Q: Import 에러 발생
```
Module not found: Can't resolve '@order/shared'
```

**해결**:
```bash
# 1. 패키지 빌드
cd packages/shared
pnpm build

# 2. 앱 재시작
cd ../../apps/delivery-customer
pnpm dev
```

### Q: 타입이 업데이트 안 됨

**해결**:
```bash
# TypeScript 캐시 삭제
rm -rf apps/*/tsconfig.tsbuildinfo
rm -rf packages/*/tsconfig.tsbuildinfo

# 개발 서버 재시작
pnpm dev
```

### Q: 환경 변수가 적용 안 됨

**해결**:
```bash
# .env.local 파일 확인
cat apps/delivery-customer/.env.local

# 개발 서버 완전 재시작 (.next 삭제)
rm -rf apps/delivery-customer/.next
cd apps/delivery-customer && pnpm dev
```

---

## 📚 참고 문서

- **루트 디렉토리**:
  - `ENV_MANAGEMENT.md` - 환경 변수 관리 가이드

- **앱별 문서**:
  - `apps/delivery-customer/CHECKLIST.md` - 배달 앱 체크리스트
  - `apps/delivery-customer/AUTH_SETUP.md` - 인증 설정 가이드
  - `apps/table-order/MODIFICATION_NEEDED.md` - 테이블 주문 수정 사항

- **외부 문서**:
  - [Turborepo 공식 문서](https://turbo.build/repo/docs)
  - [Zustand 공식 문서](https://zustand-demo.pmnd.rs/)
  - [TanStack Query 공식 문서](https://tanstack.com/query)
  - [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)

---

## ✨ Best Practices

### 1. 공통 로직은 shared에
반복되는 코드를 발견하면 `packages/shared`로 이동하세요.

**Before**:
```typescript
// apps/delivery-customer/src/utils/price.ts
export const formatPrice = (price: number) => `${price.toLocaleString()}원`;

// apps/table-order/src/utils/price.ts
export const formatPrice = (price: number) => `${price.toLocaleString()}원`;
```

**After**:
```typescript
// packages/shared/src/utils/format.ts
export const formatPrice = (price: number) => `${price.toLocaleString()}원`;

// 앱에서 사용
import { formatPrice } from '@order/shared';
```

### 2. 타입 먼저 정의
API나 Store를 만들기 전에 타입을 먼저 정의하세요.

```typescript
// 1. 타입 정의
export interface User {
  id: string;
  name: string;
  email: string;
}

// 2. API 정의
export async function getUser(id: string): Promise<User> {
  return apiClient.get<User>(`/users/${id}`);
}

// 3. Hook 정의
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id),
  });
}
```

### 3. 환경 변수는 앱별로
공통 환경 변수도 각 앱의 `.env.local`에 설정하세요.

```env
# apps/delivery-customer/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# apps/table-order/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

### 4. 타입 충돌 방지
같은 이름의 타입이 필요하면 접두사/접미사로 구분하세요.

```typescript
// ❌ 나쁜 예
export interface CreateOrderRequest {} // order.ts
export interface CreateOrderRequest {} // payment.ts (충돌!)

// ✅ 좋은 예
export interface CreateTableOrderRequest {} // order.ts
export interface CreateDeliveryOrderRequest {} // payment.ts

// 레거시 호환
export type CreateOrderRequest = CreateTableOrderRequest;
```

---

## 🎯 요약

| 항목 | 위치 | 용도 |
|------|------|------|
| **API** | `packages/shared/src/api` | 백엔드 통신 |
| **Store** | `packages/shared/src/stores` | 전역 상태 관리 |
| **Types** | `packages/shared/src/types` | 공통 타입 정의 |
| **Utils** | `packages/shared/src/utils` | 유틸리티 함수 |
| **Hooks** | `packages/shared/src/hooks` | React Query 훅 |
| **UI** | `packages/ui/src/components` | 공통 컴포넌트 |

**모든 공통 코드는 `packages/shared` 또는 `packages/ui`에 두고, 앱에서는 import해서 사용하세요!** 🚀
