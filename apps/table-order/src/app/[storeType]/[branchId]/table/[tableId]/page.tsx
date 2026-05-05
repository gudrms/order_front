'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTableStore } from '@/stores';

/**
 * QR 코드 스캔 전용 진입점
 *
 * URL 구조: /tacomolly/gimpo/table/5
 * - QR 코드를 스캔하면 이 페이지로 진입
 * - tableId를 store에 저장하고 메뉴 페이지로 리다이렉트
 * - 유효하지 않은 tableId는 오류 화면 표시
 *
 * @example
 * QR 코드 URL: https://yourdomain.com/tacomolly/gimpo/table/5
 * → 5번 테이블로 설정 후 메뉴 페이지로 이동
 */
export default function TableQRPage() {
  const params = useParams();
  const router = useRouter();
  const { setTableNumber } = useTableStore();
  const [isInvalidQR, setIsInvalidQR] = useState(false);

  const storeType = params.storeType as string;
  const branchId = params.branchId as string;
  const tableId = params.tableId as string;

  useEffect(() => {
    const tableNum = parseInt(tableId, 10);

    if (isNaN(tableNum) || tableNum <= 0) {
      // 유효하지 않은 테이블 번호 → 오류 화면 표시
      setIsInvalidQR(true);
      return;
    }

    // 테이블 번호 저장
    setTableNumber(tableNum);

    // 메뉴 페이지로 리다이렉트 (table 쿼리 파라미터 포함)
    router.replace(`/${storeType}/${branchId}/menu?table=${tableNum}`);
  }, [tableId, storeType, branchId, setTableNumber, router]);

  if (isInvalidQR) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-white px-8 text-center">
        {/* 경고 아이콘 */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
          <svg
            className="h-14 w-14 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* 안내 텍스트 */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            QR을 다시 스캔해주세요
          </h2>
          <p className="text-base text-gray-500">
            유효하지 않은 테이블 QR입니다.
          </p>
          <p className="text-sm text-gray-400">
            테이블에 부착된 QR 코드를 다시 스캔하거나
            <br />
            직원에게 문의해주세요.
          </p>
        </div>

        {/* 테이블 번호 표시 */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-6 py-3">
          <p className="text-sm text-orange-700">
            인식된 테이블 번호: <span className="font-bold">{tableId}</span>
          </p>
        </div>
      </div>
    );
  }

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
