# 🪝 Hooks

재사용 가능한 커스텀 React 훅 폴더입니다.

## 📁 예정된 훅들

- `useCart.ts` - 장바구니 상태 관리
- `useWebSocket.ts` - WebSocket 연결 관리
- `useAuth.ts` - 인증 상태 관리
- `useDebounce.ts` - 디바운스 처리
- `useLocalStorage.ts` - 로컬 스토리지 관리
- `useMediaQuery.ts` - 반응형 처리

## 💡 사용 예시

```tsx
import { useCart } from '@/hooks/useCart';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function OrderPage() {
  const { items, addItem, removeItem } = useCart();
  const { connected, sendMessage } = useWebSocket('/topic/orders');
  
  return (
    <div>
      <p>장바구니 아이템: {items.length}개</p>
      <p>WebSocket 상태: {connected ? '연결됨' : '끊김'}</p>
    </div>
  );
}
```

## 📝 작성 규칙

1. **네이밍**: `use` 접두사 필수 (예: `useCart`)
2. **단일 책임**: 하나의 훅은 하나의 기능만
3. **재사용성**: 여러 컴포넌트에서 사용 가능해야 함
4. **타입**: TypeScript 타입 정의 필수
5. **의존성 배열**: useEffect, useMemo 등의 deps 정확히 지정
