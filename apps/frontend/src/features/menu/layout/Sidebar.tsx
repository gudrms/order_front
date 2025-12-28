'use client';

import { useCategories } from '@/hooks/queries/useMenus';
import { useUIStore } from '@/stores';
import { CategoryButton } from '../components/CategoryButton';

interface SidebarProps {
  activeCategoryId: string | null;
  onCategoryClick: (categoryId: string) => void;
}

/**
 * Sidebar 컴포넌트
 * 좌측 고정, 화면 전체 높이
 * - 상단: 햄버거 + 로고 (한 줄)
 * - 중간: 카테고리 리스트 (스크롤)
 * - 하단: 직원호출 버튼 (고정)
 * - 클릭 시 해당 카테고리로 스크롤 이동
 */
export function Sidebar({ activeCategoryId, onCategoryClick }: SidebarProps) {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default-store-id';
  const { data: categories, isLoading } = useCategories(storeId);
  const { toggleSidebar, openCallPanel } = useUIStore();

  return (
    <div className="flex h-screen w-40 flex-col border-r bg-white">
      {/* 상단: 햄버거 + 로고 (한 줄) */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <button
          onClick={toggleSidebar}
          className="text-xl text-gray-700 transition-colors hover:text-gray-900 md:hidden"
          aria-label="메뉴 토글"
        >
          ☰
        </button>
        <span className="text-lg font-bold text-gray-900">m-오더</span>
      </div>

      {/* 중간: 카테고리 리스트 (스크롤) */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {/* 카테고리 목록 */}
        <div className="space-y-1">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-gray-400">
              로딩 중...
            </div>
          ) : (
            categories?.map((category) => (
              <CategoryButton
                key={category.id}
                name={category.name}
                isActive={activeCategoryId === category.id}
                onClick={() => onCategoryClick(category.id)}
                variant="vertical"
              />
            ))
          )}
        </div>
      </div>

      {/* 하단: 직원호출 버튼 (고정) */}
      <div className="border-t p-3">
        <button
          onClick={openCallPanel}
          className="w-full rounded-lg bg-gray-100 px-2 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-200"
        >
          <span className="mr-1 text-lg">🔔</span>
          직원호출
        </button>
      </div>
    </div>
  );
}
