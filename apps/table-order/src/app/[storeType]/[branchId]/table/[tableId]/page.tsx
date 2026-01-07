'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTableStore } from '@/stores';

/**
 * QR 코드 스캔 전용 진입점
 *
 * URL 구조: /tacomolly/gimpo/table/5
 * - QR 코드를 스캔하면 이 페이지로 진입
 * - tableId를 store에 저장하고 메뉴 페이지로 리다이렉트
 *
 * @example
 * QR 코드 URL: https://yourdomain.com/tacomolly/gimpo/table/5
 * → 5번 테이블로 설정 후 메뉴 페이지로 이동
 */
export default function TableQRPage() {
  const params = useParams();
  const router = useRouter();
  const { setTableNumber } = useTableStore();

  const storeType = params.storeType as string;
  const branchId = params.branchId as string;
  const tableId = params.tableId as string;

  useEffect(() => {
    const tableNum = parseInt(tableId, 10);

    if (isNaN(tableNum) || tableNum <= 0) {
      // 잘못된 테이블 번호
      router.replace(`/${storeType}/${branchId}/menu`);
      return;
    }

    // 테이블 번호 저장
    setTableNumber(tableNum);

    // 메뉴 페이지로 리다이렉트
    router.replace(`/${storeType}/${branchId}/menu`);
  }, [tableId, storeType, branchId, setTableNumber, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 mb-2">
          {tableId}번 테이블
        </div>
        <div className="text-lg text-gray-600">
          메뉴로 이동 중...
        </div>
      </div>
    </div>
  );
}
