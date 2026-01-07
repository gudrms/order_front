'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
  storeType?: string;
  branchId?: string;
  tableNumber?: number;
}

/**
 * OrderSuccessModal 컴포넌트
 * 주문 완료 후 표시되는 모달
 * - 주문 성공 메시지
 * - 주문번호 표시
 * - 2초 후 자동으로 메뉴 페이지로 복귀
 * - 카운트다운 표시 (2, 1, 0)
 */
export function OrderSuccessModal({
  isOpen,
  orderNumber,
  onClose,
  storeType = 'tacomolly',
  branchId = 'gimpo',
  tableNumber,
}: OrderSuccessModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (isOpen) {
      // 카운트다운 초기화
      setCountdown(2);

      // 1초마다 카운트다운
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 2초 후 자동으로 메뉴로 복귀
      const timer = setTimeout(() => {
        onClose();
        const menuUrl = `/${storeType}/${branchId}/menu${
          tableNumber ? `?table=${tableNumber}` : ''
        }`;
        router.push(menuUrl);
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [isOpen, onClose, router, storeType, branchId, tableNumber]);

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 z-50 bg-black/50" />

      {/* 모달 */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-8 text-center shadow-xl">
        {/* 성공 아이콘 */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* 타이틀 */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          주문되었습니다
        </h2>

        {/* 주문번호 */}
        <p className="mb-4 text-3xl font-bold text-primary">{orderNumber}</p>

        {/* 안내 메시지 */}
        <p className="mb-2 text-gray-600">주방에서 조리 중입니다</p>
        <p className="text-base text-gray-500">{countdown}초 후 창이 닫힙니다</p>
      </div>
    </>
  );
}
