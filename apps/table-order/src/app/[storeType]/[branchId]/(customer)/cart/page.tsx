'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore, useTableStore } from '@/stores';
import { CartItemCard, CartSummary } from '@/features/cart/components';
import { OrderConfirmModal } from '@/features/order';
import { getStoreUrl } from '@/lib/utils/store';

/**
 * 장바구니 페이지
 * - 장바구니 아이템 목록
 * - 수량 조절, 삭제
 * - 총 금액 계산
 * - 주문하기 (모달)
 * - URL Query Parameter에서 테이블 번호 읽기 (?table=5)
 */
export default function CartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, totalQuantity, clearCart } = useCartStore();
  const { setTableNumber } = useTableStore();

  // 주문 확인 모달 상태
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  /**
   * URL에서 테이블 번호 읽어서 Store에 저장
   */
  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      const tableNum = parseInt(table, 10);
      if (!isNaN(tableNum) && tableNum > 0) {
        setTableNumber(tableNum);
      }
    }
  }, [searchParams, setTableNumber]);

  const handleBack = () => {
    const table = searchParams.get('table');
    const url = table ? getStoreUrl(`/menu?table=${table}`) : getStoreUrl('/menu');
    router.push(url);
  };

  const handleOrder = () => {
    setIsOrderModalOpen(true);
  };

  const handleOrderSuccess = (orderNumber: string) => {
    // 1. 장바구니 비우기
    clearCart();

    // 2. 모달 닫기
    setIsOrderModalOpen(false);

    // 3. 주문 완료 페이지로 이동
    const table = searchParams.get('table');
    const url = table
      ? getStoreUrl(`/order/complete?orderNumber=${orderNumber}&table=${table}`)
      : getStoreUrl(`/order/complete?orderNumber=${orderNumber}`);
    router.push(url);
  };

  const handleOrderCancel = () => {
    setIsOrderModalOpen(false);
  };

  return (
    <>
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
      </div>

      {/* 주문 확인 모달 */}
      <OrderConfirmModal
        isOpen={isOrderModalOpen}
        onClose={handleOrderCancel}
        onSuccess={handleOrderSuccess}
      />
    </>
  );
}
