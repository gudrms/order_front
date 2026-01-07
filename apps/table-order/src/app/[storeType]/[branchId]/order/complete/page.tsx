'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStoreUrl } from '@/lib/utils/store';

/**
 * 주문 완료 페이지
 * - 주문 성공 메시지
 * - 주문번호 표시
 * - 3초 후 자동으로 메뉴로 이동
 * - 즉시 이동 버튼
 */
export default function OrderCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get('orderNumber');
  const table = searchParams.get('table');

  /**
   * 3초 후 자동으로 메뉴로 이동
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      handleBackToMenu();
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 메뉴로 돌아가기
   */
  const handleBackToMenu = () => {
    const url = table
      ? getStoreUrl(`/menu?table=${table}`)
      : getStoreUrl('/menu');
    router.push(url);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
      {/* 성공 아이콘 */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
        <div className="text-6xl">✅</div>
      </div>

      {/* 메시지 */}
      <h1 className="mb-4 text-2xl font-bold text-gray-900">
        주문이 접수되었습니다!
      </h1>

      {/* 주문번호 */}
      {orderNumber && (
        <div className="mb-6 rounded-lg border-2 border-green-200 bg-white px-8 py-4">
          <p className="mb-1 text-center text-sm text-gray-600">주문번호</p>
          <p className="text-center text-3xl font-bold text-green-600">
            {orderNumber}
          </p>
        </div>
      )}

      {/* 안내 메시지 */}
      <p className="mb-8 text-center text-gray-600">
        주방에서 조리 중입니다.
        <br />
        잠시만 기다려주세요!
      </p>

      {/* 버튼 */}
      <button
        onClick={handleBackToMenu}
        className="rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        메뉴로 돌아가기
      </button>

      {/* 자동 이동 안내 */}
      <p className="mt-6 text-sm text-gray-400">3초 후 자동으로 이동합니다</p>
    </div>
  );
}
