'use client';

import { useEffect, useMemo } from 'react';
import { useCategories, useMenus } from '@/hooks/queries/useMenus';
import { useActiveSection } from '../hooks/useActiveSection';
import { CategorySection } from './CategorySection';

interface MenuGridProps {
  onCategoryActive?: (categoryId: string) => void;
  onMenuClick: (menuId: string) => void;
}

/**
 * MenuGrid 컴포넌트
 * 전체 메뉴를 카테고리별 섹션으로 표시
 * - 스크롤 네비게이션
 * - 활성 섹션 자동 추적
 */
export function MenuGrid({ onCategoryActive, onMenuClick }: MenuGridProps) {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default-store-id';

  // 데이터 조회
  const { data: categories, isLoading: categoriesLoading } =
    useCategories(storeId);
  const { data: menus, isLoading: menusLoading } = useMenus(storeId);

  // 각 섹션에 대한 ref Map - useMemo로 안정적으로 관리
  const sectionRefs = useMemo(() => {
    const refs = new Map<string, React.RefObject<HTMLElement | null>>();

    if (categories) {
      categories.forEach((category) => {
        refs.set(category.id, { current: null });
      });
    }

    return refs;
  }, [categories]);

  // 활성 섹션 추적
  const activeCategoryId = useActiveSection(sectionRefs);

  // 활성 카테고리 변경 시 부모에게 알림
  useEffect(() => {
    if (activeCategoryId !== null && onCategoryActive) {
      onCategoryActive(activeCategoryId);
    }
  }, [activeCategoryId, onCategoryActive]);

  // 로딩 상태
  if (categoriesLoading || menusLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">메뉴를 불러오는 중...</div>
      </div>
    );
  }

  // 데이터 없음
  if (!categories || !menus || categories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">표시할 메뉴가 없습니다.</div>
      </div>
    );
  }

  // 카테고리별로 메뉴 그룹화
  const menusByCategory = menus.reduce(
    (acc, menu) => {
      if (!acc[menu.categoryId]) {
        acc[menu.categoryId] = [];
      }
      acc[menu.categoryId].push(menu);
      return acc;
    },
    {} as Record<string, typeof menus>
  );

  return (
    <div className="px-6 py-8">
      {/* 카테고리별 섹션 렌더링 */}
      {categories.map((category) => {
        const categoryMenus = menusByCategory[category.id] || [];
        const ref = sectionRefs.get(category.id);

        if (!ref) {
          return null;
        }

        return (
          <CategorySection
            key={category.id}
            ref={ref}
            category={category}
            menus={categoryMenus}
            onMenuClick={onMenuClick}
          />
        );
      })}
    </div>
  );
}
