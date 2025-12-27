'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores';
import {
  TopBar,
  Sidebar,
  BottomBar,
  DetailPanel,
} from '@/features/menu/layout';
import { MenuGrid } from '@/features/menu/components';

/**
 * 고객용 메뉴 페이지
 * - 스크롤 네비게이션 방식
 * - 카테고리별 섹션으로 구성
 * - 자동 활성 섹션 추적
 */
export default function MenuPage() {
  // 현재 활성화된 카테고리 (Intersection Observer가 자동으로 감지)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // UI 스토어에서 메뉴 상세 패널 열기 함수 가져오기
  const { openMenuDetail } = useUIStore();

  /**
   * 카테고리 클릭 시 해당 섹션으로 스크롤 이동
   */
  const handleCategoryClick = (categoryId: number) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  /**
   * 활성 카테고리 변경 시 (Intersection Observer)
   */
  const handleCategoryActive = (categoryId: number) => {
    setActiveCategoryId(categoryId);
  };

  return (
    <>
      {/* 메인 레이아웃 */}
      <div className="flex h-screen bg-gray-50">
        {/* 좌측 사이드바 */}
        <Sidebar
          activeCategoryId={activeCategoryId}
          onCategoryClick={handleCategoryClick}
        />

        {/* 중앙 메인 컨텐츠 */}
        <div className="flex flex-1 flex-col">
          {/* 상단 바 */}
          <TopBar
            activeCategoryId={activeCategoryId}
            onCategoryClick={handleCategoryClick}
          />

          {/* 메뉴 그리드 (스크롤 영역) */}
          <div className="flex-1 overflow-auto">
            <MenuGrid
              onCategoryActive={handleCategoryActive}
              onMenuClick={openMenuDetail}
            />
          </div>

          {/* 하단 바 */}
          <BottomBar />
        </div>
      </div>

      {/* 우측 상세 패널 (fixed이므로 레이아웃 밖에 배치) */}
      <DetailPanel />
    </>
  );
}
