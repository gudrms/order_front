'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore, useTableStore } from '@/stores';
import { CartItemCard, CartSummary } from '@/features/cart/components';
import {
  OrderConfirmModal,
  OrderSuccessModal,
} from '@/features/order';

/**
 * 장바구니 페이지
 * - 장바구니 아이템 목록
 * - 수량 조절, 삭제
 * - 총 금액 계산
 * - 주문하기
 */
export default function CartPage() {
  const router = useRouter();
  const params = useParams();
  const storeType = (params?.storeType as string) || 'tacomolly';
  const branchId = (params?.branchId as string) || 'gimpo';

  const { items, totalQuantity, clearCart } = useCartStore();
  const { tableNumber } = useTableStore();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const handleBack = () => {
    router.push('/menu');
  };

  const handleOrder = () => {
    setIsConfirmOpen(true);
  };

  const handleOrderSuccess = (newOrderNumber: string) => {
    setOrderNumber(newOrderNumber);
    setIsConfirmOpen(false);
    setIsSuccessOpen(true);
    clearCart();
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-4 border-b bg-white px-6 py-4">
        <button
          onClick={handleBack}
          className="text-2xl text-gray-700 transition-colors hover:text-gray-900"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900">장바구니</h1>
        <span className="text-sm text-gray-500">({totalQuantity}개)</span>
      </div>

      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          // 빈 장바구니
          <div className="flex h-full flex-col items-center justify-center p-6">
            <div className="mb-4 text-6xl">🛒</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              장바구니가 비어있습니다
            </h2>
            <p className="mb-6 text-gray-600">메뉴를 담아주세요!</p>
            <button
              onClick={handleBack}
              className="bg-primary hover:bg-primary/90 rounded-lg px-6 py-3 text-white transition-colors"
            >
              메뉴 보러가기
            </button>
          </div>
        ) : (
          // 장바구니 아이템 목록
          <div className="space-y-4 p-6">
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 하단 요약 (아이템이 있을 때만 표시) */}
      {items.length > 0 && <CartSummary onOrder={handleOrder} />}

      {/* 주문 확인 모달 */}
      <OrderConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onSuccess={handleOrderSuccess}
      />

      {/* 주문 성공 모달 */}
      <OrderSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderNumber={orderNumber}
        storeType={storeType}
        branchId={branchId}
        tableNumber={tableNumber || undefined}
      />
    </div>
  );
}
