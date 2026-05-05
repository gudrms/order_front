'use client';

import { useState } from 'react';
import { calculateOrderTotals, type OrderItemInput as CoreOrderItemInput } from '@order/order-core';
import { useCartStore, useTableStore } from '@/stores';
import { useCreateOrder } from '@/hooks/mutations/useCreateOrder';
import { ApiClientError } from '@/lib/api/client';
import type {
  CreateOrderRequest,
  OrderItemInput,
} from '@/lib/api/endpoints/order';

/**
 * 백엔드 에러 메시지를 고객용 한국어로 변환합니다.
 * 주문 실패 / 테이블 없음 / 예약 테이블 / 품절 등 구분 처리.
 */
function parseOrderError(err: unknown): { message: string; type: 'warning' | 'error' } {
  if (err instanceof ApiClientError) {
    const msg = err.message;
    // 테이블을 찾을 수 없음
    if (msg.includes('Table not found')) {
      return { message: 'QR을 다시 스캔해주세요. 이 테이블 번호를 찾을 수 없습니다.', type: 'warning' };
    }
    // 예약 테이블
    if (msg.includes('Table is reserved')) {
      return { message: '이 테이블은 예약석입니다. 직원에게 문의해주세요.', type: 'warning' };
    }
    // 매장 비활성 / 없음
    if (
      msg.includes('Store not found') ||
      msg.includes('inactive') ||
      msg.includes('not active') ||
      msg.includes('not accepting')
    ) {
      return { message: '현재 매장이 운영 중이 아닙니다. 직원에게 문의해주세요.', type: 'warning' };
    }
    // 메뉴/옵션 품절
    if (msg.includes('not available') || msg.includes('sold out') || msg.includes('soldOut')) {
      const name = msg.split(': ')[1] ?? '일부 메뉴';
      return { message: `'${name}'은(는) 현재 주문할 수 없습니다. 해당 메뉴를 장바구니에서 제거해주세요.`, type: 'warning' };
    }
    // 요청 타임아웃
    if (err.status === 408) {
      return { message: '요청 시간이 초과되었습니다. 네트워크를 확인 후 다시 시도해주세요.', type: 'error' };
    }
    // 서버 오류
    if (err.status >= 500) {
      return { message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', type: 'error' };
    }
  }
  const message = err instanceof Error ? err.message : '주문 생성에 실패했습니다. 다시 시도해주세요.';
  return { message, type: 'error' };
}

/**
 * OrderConfirmModal Props
 */
interface OrderConfirmModalProps {
  /** 모달 오픈 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 주문 성공 핸들러 */
  onSuccess: (orderNumber: string) => void;
}

/**
 * 주문 확인 모달
 * - 테이블 번호 표시
 * - 총 금액 표시
 * - 주문 생성 API 호출
 * - 로딩/에러 처리
 */
export function OrderConfirmModal({
  isOpen,
  onClose,
  onSuccess,
}: OrderConfirmModalProps) {
  const { tableNumber } = useTableStore();
  const { items, totalPrice } = useCartStore();
  const coreOrderItems: CoreOrderItemInput[] = items.map((item) => ({
    menuId: item.menuId,
    name: item.menuName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }));
  const orderTotals = calculateOrderTotals({ items: coreOrderItems });

  const [error, setError] = useState<{ message: string; type: 'warning' | 'error' } | null>(null);

  const { mutate: createOrder, isPending } = useCreateOrder();

  /**
   * 주문하기 버튼 클릭
   */
  const handleConfirm = () => {
    setError(null);

    if (!tableNumber) {
      setError({ message: '테이블 번호가 설정되지 않았습니다. QR을 다시 스캔해주세요.', type: 'warning' });
      return;
    }

    if (items.length === 0) {
      setError({ message: '장바구니가 비어있습니다.', type: 'error' });
      return;
    }

    // 장바구니 아이템을 주문 아이템으로 변환
    const orderItems: OrderItemInput[] = items.map((item) => ({
      menuId: item.menuId,
      menuName: item.menuName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      options: item.options,
    }));

    // 주문 생성 요청
    const request: CreateOrderRequest = {
      tableNumber,
      items: orderItems,
      totalAmount: orderTotals.totalAmount,
    };

    createOrder(request, {
      onSuccess: (data) => {
        onSuccess(data.orderNumber);
      },
      onError: (err) => {
        setError(parseOrderError(err));
      },
    });
  };

  // 모달이 닫힐 때 에러 초기화
  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-gray-900">주문 확인</h2>

        {/* 테이블 정보 */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">테이블</span>
            <span className="text-lg font-semibold text-gray-900">
              {tableNumber || '-'}번
            </span>
          </div>
        </div>

        {/* 총 금액 */}
        <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-700">
              총 금액
            </span>
            <span className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            className={`mb-4 rounded-lg p-4 text-sm flex items-start gap-3 ${
              error.type === 'warning'
                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span className="text-lg leading-none shrink-0">
              {error.type === 'warning' ? '⚠️' : '❌'}
            </span>
            <p className="leading-snug">{error.message}</p>
          </div>
        )}

        {/* 안내 메시지 */}
        <p className="mb-6 text-sm text-gray-500">
          주문하시겠습니까? 주문 후에는 취소가 어려울 수 있습니다.
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '주문 중...' : '주문하기'}
          </button>
        </div>
      </div>
    </>
  );
}
