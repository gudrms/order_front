# 🗄️ Stores

Zustand 상태 관리 스토어 폴더입니다.

## 📁 예정된 스토어들

- `cartStore.ts` - 장바구니 상태 (items, totalPrice, totalQuantity)
- `uiStore.ts` - UI 상태 (모달, 드로어 열림/닫힘)
- `authStore.ts` - 인증 상태 (사용자 정보, 로그인 여부)

## 💡 사용 예시

### cartStore.ts
```tsx
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  totalPrice: number;
  totalQuantity: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  totalPrice: 0,
  totalQuantity: 0,
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id),
  })),
  
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, quantity } : item
    ),
  })),
  
  clearCart: () => set({ items: [], totalPrice: 0, totalQuantity: 0 }),
}));
```

### 컴포넌트에서 사용
```tsx
import { useCartStore } from '@/stores/cartStore';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  
  return (
    <div>
      <p>장바구니 아이템: {items.length}개</p>
      <button onClick={clearCart}>비우기</button>
    </div>
  );
}
```

## 📝 작성 규칙

1. **네이밍**: `use` + 이름 + `Store` (예: `useCartStore`)
2. **인터페이스**: 스토어 타입 정의 필수
3. **선택자**: 필요한 상태만 구독 (성능 최적화)
4. **불변성**: 상태 업데이트 시 불변성 유지
5. **Persist**: 필요시 `persist` 미들웨어 사용 (로컬 스토리지 저장)
