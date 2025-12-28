'use client';

import { useCartStore } from '@/stores';

interface CartSummaryProps {
  onOrder: () => void;
}

/**
 * CartSummary 컴포넌트
 * 장바구니 총 금액 요약 및 주문하기 버튼
 * - 총 아이템 수
 * - 총 금액
 * - 주문하기 버튼
 */
export function CartSummary({ onOrder }: CartSummaryProps) {
  const { totalPrice, totalQuantity } = useCartStore();

  return (
    <div className="sticky bottom-0 border-t bg-white p-6">
      {/* 총 금액 정보 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-gray-600">총 상품 수</span>
          <span className="font-medium">{totalQuantity}개</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">총 금액</span>
          <span className="text-primary text-2xl font-bold">
            {totalPrice.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 주문하기 버튼 */}
      <button
        onClick={onOrder}
        disabled={totalQuantity === 0}
        className="bg-primary hover:bg-primary/90 w-full rounded-lg py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        주문하기
      </button>
    </div>
  );
}
