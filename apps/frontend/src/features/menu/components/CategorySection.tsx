'use client';

import { forwardRef } from 'react';
import type { MenuCategory, Menu } from '@/types';
import { MenuCard } from './MenuCard';

interface CategorySectionProps {
  category: MenuCategory;
  menus: Menu[];
  onMenuClick: (menuId: string) => void; // UUID
}

/**
 * CategorySection 컴포넌트
 * 카테고리별 섹션 (헤더 + 메뉴 그리드)
 * - 스크롤 타겟으로 사용 (id, ref)
 * - Intersection Observer 감지 대상
 */
export const CategorySection = forwardRef<HTMLElement, CategorySectionProps>(
  ({ category, menus, onMenuClick }, ref) => {
    // 메뉴가 없으면 렌더링하지 않음
    if (!menus || menus.length === 0) {
      return null;
    }

    const handleClick = (menuId: string) => {
      onMenuClick(menuId);
    };

    return (
      <section
        ref={ref}
        id={`category-${category.id}`}
        data-category-id={category.id}
        className="mb-12 scroll-mt-20"
      >
        {/* 카테고리 헤더 */}
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span className="text-3xl">{getCategoryIcon(category.name)}</span>
            <span>{category.name}</span>
          </h2>
          {category.description && (
            <p className="mt-1 text-gray-600">{category.description}</p>
          )}
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {menus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onClick={handleClick} />
          ))}
        </div>
      </section>
    );
  }
);

CategorySection.displayName = 'CategorySection';

/**
 * 카테고리 이름에 따른 아이콘 반환
 */
function getCategoryIcon(categoryName: string): string {
  const name = categoryName.toLowerCase();

  if (name.includes('치킨') || name.includes('chicken')) return '🍗';
  if (name.includes('피자') || name.includes('pizza')) return '🍕';
  if (name.includes('파스타') || name.includes('pasta')) return '🍝';
  if (name.includes('샐러드') || name.includes('salad')) return '🥗';
  if (
    name.includes('음료') ||
    name.includes('drink') ||
    name.includes('beverage')
  )
    return '🥤';
  if (name.includes('디저트') || name.includes('dessert')) return '🍰';
  if (name.includes('술') || name.includes('주류') || name.includes('alcohol'))
    return '🍺';
  if (name.includes('한식') || name.includes('korean')) return '🍚';
  if (name.includes('중식') || name.includes('chinese')) return '🥟';
  if (name.includes('일식') || name.includes('japanese')) return '🍱';
  if (name.includes('양식') || name.includes('western')) return '🍴';
  if (name.includes('고기') || name.includes('meat')) return '🥩';
  if (name.includes('해산물') || name.includes('seafood')) return '🦐';
  if (name.includes('커피') || name.includes('coffee')) return '☕';

  return '🍽️';
}
