'use client';

import { useCartStore } from '@/stores';
import { CartSummary } from '@/components/ui/CartSummary';

interface CartSummaryContainerProps {
  onOrder: () => void;
}

/**
 * CartSummaryContainer 컴포넌트 (비즈니스 로직)
 *
 * Zustand store에서 장바구니 정보를 가져와 Presenter에 전달
 */
export function CartSummaryContainer({ onOrder }: CartSummaryContainerProps) {
  const { totalPrice, totalQuantity } = useCartStore();

  return (
    <CartSummary
      totalQuantity={totalQuantity}
      totalPrice={totalPrice}
      onOrder={onOrder}
    />
  );
}
