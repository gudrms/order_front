'use client';

import { useCartStore } from '@/stores';
import type { CartItem } from '@/stores';
import { CartItemCard } from '@order/ui';

interface CartItemCardContainerProps {
  item: CartItem;
}

/**
 * CartItemCardContainer 컴포넌트 (비즈니스 로직)
 *
 * Zustand 스토어와 상호작용하며 비즈니스 로직을 처리합니다.
 * - 수량 증가/감소 로직
 * - 삭제 확인 로직
 * - Presenter에 데이터와 콜백 전달
 *
 * @param item - 장바구니 아이템 데이터
 */
export function CartItemCardContainer({ item }: CartItemCardContainerProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleIncrease = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      // 수량이 1일 때는 삭제 확인
      if (confirm(`${item.menuName}을(를) 삭제하시겠습니까?`)) {
        removeItem(item.id);
      }
    }
  };

  const handleRemove = () => {
    if (confirm(`${item.menuName}을(를) 삭제하시겠습니까?`)) {
      removeItem(item.id);
    }
  };

  return (
    <CartItemCard
      name={item.menuName}
      quantity={item.quantity}
      price={item.totalPrice}
      options={item.options}
      imageUrl={item.imageUrl}
      onIncrease={handleIncrease}
      onDecrease={handleDecrease}
      onRemove={handleRemove}
    />
  );
}
