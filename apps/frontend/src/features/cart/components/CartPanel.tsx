'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createOrder } from '@/lib/api/endpoints/order';
import { useCartStore } from '@/stores/cartStore';
import { useTableStore } from '@/stores/tableStore';
import { useUIStore } from '@/stores/uiStore';
import { CartItemCard } from './CartItemCard';
import { OrderSuccessModal } from '@/features/order';

/**
 * CartPanel 컴포넌트
 * 우측 고정 장바구니 패널
 * - 장바구니 아이템 목록
 * - 수량 조절
 * - 총 금액 표시
 * - 닫기 / 주문하기 버튼
 */
export function CartPanel() {
  const { isCartOpen, closeCart } = useUIStore();
  const {
    items,
    totalPrice,
    totalQuantity,
    clearCart,
  } = useCartStore();
  const { tableNumber } = useTableStore();

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    orderNumber: '',
  });

  // 주문 생성 mutation
  const orderMutation = useMutation({
    mutationFn: () =>
      createOrder(
        {
          tableNumber: tableNumber || 0,
          items: items.map((item) => ({
            menuId: item.menuId,
            menuName: item.menuName,
            quantity: item.quantity,
            unitPrice: item.unitPrice, // basePrice → unitPrice
            totalPrice: item.totalPrice,
            options: item.options,
          })),
          totalAmount: totalPrice,
        },
        'gimpo' // branchId - TODO: 동적으로 변경
      ),
    onSuccess: (data) => {
      // 장바구니 비우기
      clearCart();

      // 성공 모달 표시
      setSuccessModal({
        isOpen: true,
        orderNumber: data.orderNumber,
      });
    },
    onError: (error) => {
      alert('주문에 실패했습니다. 다시 시도해주세요.');
      console.error('Order error:', error);
    },
  });

  const handleOrder = () => {
    if (items.length === 0) {
      alert('장바구니가 비어있습니다');
      return;
    }

    if (!tableNumber) {
      alert('테이블 번호를 확인할 수 없습니다');
      return;
    }

    // 즉시 주문 실행
    orderMutation.mutate();
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed right-0 top-0 flex h-screen w-96 flex-col bg-white shadow-lg">
        {/* 헤더 */}
        <div className="border-b p-4">
          <h2 className="text-lg font-bold">🛒 장바구니</h2>
        </div>

        {/* 아이템 목록 (스크롤) */}
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              장바구니가 비어있습니다
            </div>
          ) : (
            items.map((item) => <CartItemCard key={item.id} item={item} />)
          )}
        </div>

        {/* 하단: 총계 + 버튼 */}
        <div className="border-t p-4">
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm text-gray-600">
              <span>총 {totalQuantity}개</span>
            </div>
            <div className="text-xl font-bold">
              {totalPrice.toLocaleString()}원
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={closeCart}
              className="flex-1 rounded border border-gray-300 py-3 font-medium hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              onClick={handleOrder}
              disabled={items.length === 0 || orderMutation.isPending}
              className="flex-1 rounded bg-primary py-3 font-medium text-white hover:bg-primary-dark disabled:bg-gray-300"
            >
              {orderMutation.isPending ? '주문 중...' : '주문하기'}
            </button>
          </div>
        </div>
      </div>

      {/* 주문 성공 모달 */}
      <OrderSuccessModal
        isOpen={successModal.isOpen}
        orderNumber={successModal.orderNumber}
        onClose={() => setSuccessModal({ isOpen: false, orderNumber: '' })}
        tableNumber={tableNumber ?? undefined}
      />
    </>
  );
}
