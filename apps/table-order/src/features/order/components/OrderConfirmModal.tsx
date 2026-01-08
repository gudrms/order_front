'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useCartStore, useTableStore } from '@/stores';
import { api } from '@order/shared';
import type {
  CreateOrderRequest,
  OrderItemInput,
} from '@order/shared/endpoints/order';

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
  const params = useParams();
  const branchId = params?.branchId as string;

  const { tableNumber } = useTableStore();
  const { items, totalPrice } = useCartStore();

  const [error, setError] = useState<string | null>(null);

  /**
   * 주문 생성 Mutation
   */
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!tableNumber) {
        throw new Error('테이블 번호가 설정되지 않았습니다.');
      }

      if (items.length === 0) {
        throw new Error('장바구니가 비어있습니다.');
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
        totalAmount: totalPrice,
      };

      return createOrder(request, branchId);
    },
    onSuccess: (data) => {
      // 성공 시 부모 컴포넌트로 주문번호 전달
      onSuccess(data.orderNumber);
    },
    onError: (err) => {
      // 에러 처리
      const errorMessage =
        err instanceof Error ? err.message : '주문 생성에 실패했습니다.';
      setError(errorMessage);
    },
  });

  /**
   * 주문하기 버튼 클릭
   */
  const handleConfirm = () => {
    setError(null);
    createOrderMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
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
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 안내 메시지 */}
        <p className="mb-6 text-sm text-gray-500">
          주문하시겠습니까? 주문 후에는 취소가 어려울 수 있습니다.
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={createOrderMutation.isPending}
            className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={createOrderMutation.isPending}
            className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createOrderMutation.isPending ? '주문 중...' : '주문하기'}
          </button>
        </div>
      </div>
    </>
  );
}
