'use client';

import { useUIStore, useCartStore } from '@/stores';

/**
 * BottomBar 컴포넌트
 * 화면 하단 고정
 * - 주문내역 버튼
 * - 장바구니 버튼 (장바구니가 닫혀있을 때만 표시)
 */
export function BottomBar() {
  const { isCartOpen, toggleCart, toggleOrderHistory } = useUIStore();
  const { totalQuantity, totalPrice } = useCartStore();

  const hasItems = totalQuantity > 0;

  return (
    <div className="flex h-20 items-center justify-end gap-4 border-t bg-white px-6">
      {/* 주문내역 버튼 */}
      <button
        onClick={toggleOrderHistory}
        className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        📋 주문내역
      </button>

      {/* 장바구니 버튼 (장바구니가 닫혀있을 때만 표시) */}
      {!isCartOpen && (
        <button
          onClick={toggleCart}
          disabled={!hasItems}
          className={`rounded-lg px-6 py-3 font-semibold transition-colors ${
            hasItems
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          } `}
        >
          {hasItems ? (
            <>
              🛒 장바구니 ({totalQuantity}) {totalPrice.toLocaleString()}원
            </>
          ) : (
            '장바구니가 비어있습니다'
          )}
        </button>
      )}
    </div>
  );
}
