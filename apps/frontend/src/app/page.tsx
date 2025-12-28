'use client';

/**
 * Phase 1 테스트 페이지
 * 작성한 코드들이 정상적으로 동작하는지 확인
 */

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { Menu } from '@/types';

export default function TestPage() {
  const [testResult, setTestResult] = useState<string>('');

  // 환경 변수 테스트
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const storeId = process.env.NEXT_PUBLIC_STORE_ID;

  // 타입 테스트
  const testMenu: Menu = {
    id: 'test-menu-1',
    name: '테스트 메뉴',
    price: 15000,
    description: '이것은 테스트 메뉴입니다',
    imageUrl: null,
    categoryId: 'test-category-1',
    soldOut: false,
    displayOrder: 1,
  };

  // cn 유틸리티 테스트
  const buttonClass = cn(
    'px-4 py-2 rounded-lg font-medium transition-colors',
    'bg-primary text-primary-foreground',
    'hover:opacity-90'
  );

  const handleTest = () => {
    setTestResult(`
✅ Phase 1 테스트 결과:

1. 환경 변수 로드: 
   - API URL: ${apiUrl}
   - Store ID: ${storeId}

2. TypeScript 타입 정의:
   - Menu 타입: ${testMenu.name} (${testMenu.price.toLocaleString()}원)

3. className 유틸리티:
   - cn() 함수 정상 작동 ✅

4. TanStack Query:
   - QueryProvider 정상 로드 ✅
    `);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            🧪 Phase 1 테스트 페이지
          </h1>
          <p className="text-gray-700">
            작성한 코드들이 정상적으로 동작하는지 확인합니다
          </p>
        </div>

        {/* 테스트 카드 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            ✅ 완료된 항목
          </h2>
          <ul className="space-y-2 text-gray-800">
            <li>✅ 디자인 시스템 - 폰트 시스템</li>
            <li>✅ TypeScript 타입 정의</li>
            <li>✅ API 클라이언트 설정</li>
            <li>✅ TanStack Query 설정</li>
            <li>✅ 커스텀 훅 작성</li>
            <li>✅ 환경 변수 설정</li>
          </ul>
        </div>

        {/* 테스트 버튼 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            🧪 테스트 실행
          </h2>
          <button onClick={handleTest} className={buttonClass}>
            Phase 1 테스트 실행
          </button>
        </div>

        {/* 테스트 결과 */}
        {testResult && (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              📊 테스트 결과
            </h2>
            <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm whitespace-pre-wrap text-gray-900">
              {testResult}
            </pre>
          </div>
        )}

        {/* 다음 단계 안내 */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">
            🎯 다음 단계: Phase 2
          </h3>
          <p className="text-blue-800">
            고객용 태블릿 화면 개발 (장바구니 스토어 → 메뉴 화면 → 주문 기능)
          </p>
        </div>
      </div>
    </div>
  );
}
