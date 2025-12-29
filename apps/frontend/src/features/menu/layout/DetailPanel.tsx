'use client';

import { useUIStore } from '@/stores';
import { CallContent } from '../components/CallContent';

/**
 * DetailPanel 컴포넌트
 * 우측에서 슬라이드인되는 상세 패널
 * - 직원호출 전용 (type='call')
 */
export function DetailPanel() {
  const { detailPanel, closeDetailPanel } = useUIStore();
  const { isOpen, type } = detailPanel;

  // 패널이 닫혀있거나 call이 아니면 아무것도 렌더링하지 않음
  if (!isOpen || type !== 'call') {
    return null;
  }

  return (
    <>
      {/* 백드롭 (패널 열렸을 때 배경 어둡게) */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={closeDetailPanel}
      />

      {/* 패널 */}
      <div className="fixed top-0 right-0 z-50 h-full w-[400px] bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-2xl font-bold text-gray-900">직원 호출</h2>
          <button
            onClick={closeDetailPanel}
            className="text-3xl leading-none text-gray-400 transition-colors hover:text-gray-600"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 내용 (스크롤 가능) */}
        <div className="h-[calc(100%-80px)] overflow-y-auto">
          <CallContent />
        </div>
      </div>
    </>
  );
}
