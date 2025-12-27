'use client';

import { useCreateCall } from '@/hooks/mutations/useCreateCall';
import { useUIStore } from '@/stores';
import type { CallType } from '@/types';

/**
 * CallContent 컴포넌트
 * 직원호출 버튼 메뉴
 */
export function CallContent() {
  const { mutate: createCall, isPending } = useCreateCall();
  const closeDetailPanel = useUIStore((state) => state.closeDetailPanel);

  // 테이블 ID (실제로는 props나 URL에서 가져와야 함)
  const tableId = 12; // 임시

  const callTypes: Array<{
    type: CallType;
    icon: string;
    label: string;
    description: string;
  }> = [
    { type: 'WATER', icon: '💧', label: '물', description: '물이 필요해요' },
    {
      type: 'TISSUE',
      icon: '🧻',
      label: '티슈',
      description: '티슈가 필요해요',
    },
    {
      type: 'CUTLERY',
      icon: '🥄',
      label: '수저',
      description: '수저가 필요해요',
    },
    {
      type: 'OTHER',
      icon: '💬',
      label: '기타',
      description: '직원을 호출합니다',
    },
  ];

  // 직원 호출 처리
  const handleCall = (type: CallType) => {
    createCall(
      { tableId, type },
      {
        onSuccess: () => {
          // 성공 메시지 (나중에 토스트로 변경)
          alert(`직원을 호출했습니다! (${type})`);
          // 패널 닫기
          closeDetailPanel();
        },
        onError: (error) => {
          // 에러 메시지
          alert('직원 호출에 실패했습니다. 다시 시도해주세요.');
          console.error('Call error:', error);
        },
      }
    );
  };

  return (
    <div className="p-6">
      {/* 안내 문구 */}
      <p className="mb-6 text-center text-gray-600">무엇이 필요하신가요?</p>

      {/* 호출 버튼 목록 */}
      <div className="space-y-3">
        {callTypes.map((item) => (
          <button
            key={item.type}
            onClick={() => handleCall(item.type)}
            disabled={isPending}
            className="flex w-full items-center gap-4 rounded-lg border p-5 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* 아이콘 */}
            <span className="text-4xl">{item.icon}</span>

            {/* 텍스트 */}
            <div className="flex-1 text-left">
              <div className="text-lg font-semibold text-gray-900">
                {item.label}
              </div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>

            {/* 로딩 표시 */}
            {isPending && (
              <div className="text-sm text-gray-400">호출 중...</div>
            )}
          </button>
        ))}
      </div>

      {/* 안내 메시지 */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <p className="text-center text-sm text-blue-800">
          💡 버튼을 누르면 즉시 직원에게 알림이 전달됩니다
        </p>
      </div>
    </div>
  );
}
