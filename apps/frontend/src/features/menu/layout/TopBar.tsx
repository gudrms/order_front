'use client';

import { useCategories } from '@/hooks/queries/useMenus';
import { CategoryButton } from '../components/CategoryButton';
import { useUIStore } from '@/stores';

interface TopBarProps {
  storeId?: string;
  tableNumber?: number;
  activeCategoryId: string | null;
  onCategoryClick: (categoryId: string) => void;
}

/**
 * TopBar 컴포넌트
 * Sidebar 우측에 위치
 * - 카테고리 탭 (가로 스크롤)
 * - 테이블 번호
 * - 클릭 시 해당 카테고리로 스크롤 이동
 */
export function TopBar({
  storeId,
  tableNumber = 12,
  activeCategoryId,
  onCategoryClick,
}: TopBarProps) {
  const finalStoreId = storeId || process.env.NEXT_PUBLIC_STORE_ID || 'default-store-id';
  const { data: categories, isLoading } = useCategories(finalStoreId);
  const openCallPanel = useUIStore((state) => state.openCallPanel);

  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* 왼쪽: 카테고리 탭 (가로 스크롤) */}
      <div className="scrollbar-hide mr-6 flex flex-1 gap-2 overflow-x-auto">
        {/* 카테고리 목록 */}
        {isLoading ? (
          <div className="px-4 py-2 text-gray-400">로딩 중...</div>
        ) : (
          categories?.map((category) => (
            <CategoryButton
              key={category.id}
              name={category.name}
              isActive={activeCategoryId === category.id}
              onClick={() => onCategoryClick(category.id)}
              variant="horizontal"
            />
          ))
        )}
      </div>

      {/* 오른쪽: 직원호출 버튼 + 테이블 번호 */}
      <div className="flex items-center gap-3 whitespace-nowrap">
        <button
          onClick={openCallPanel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          🔔 직원호출
        </button>
        <div className="text-lg font-semibold">
          테이블 {tableNumber}
        </div>
      </div>
    </div>
  );
}
