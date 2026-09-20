'use client';

import { cn } from '@/lib/utils';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useCategories, useMenus } from '../../hooks/queries/useMenus';
import { useUIStore } from '../../stores/uiStore';

export default function CategoryTabs() {
    const { selectedCategory, setSelectedCategory } = useUIStore();
    const { storeId } = useCurrentStore();
    const { data: categories } = useCategories(storeId);
    // MenuList와 같은 쿼리 키라 추가 요청 없이 캐시를 공유한다.
    const { data: menus } = useMenus(storeId);

    const displayCategories = (categories || []).filter((category) => {
        if (category.name === '이벤트' || category.name === 'Event') return false;
        // 노출 메뉴가 없는 카테고리는 탭을 눌러도 빈 화면이라 숨긴다.
        // 메뉴가 아직 로딩 중이면 탭이 깜빡이지 않도록 그대로 둔다.
        if (!menus) return true;
        return menus.some((menu) => menu.categoryId === category.id);
    });

    return (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={cn(
                        'flex-none px-6 py-4 text-sm font-bold transition-colors relative',
                        selectedCategory === 'ALL'
                            ? 'text-brand-black'
                            : 'text-gray-400 hover:text-gray-600'
                    )}
                >
                    전체
                    {selectedCategory === 'ALL' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-black" />
                    )}
                </button>
                {displayCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                            'flex-none px-6 py-4 text-sm font-bold transition-colors relative',
                            selectedCategory === category.id
                                ? 'text-brand-black'
                                : 'text-gray-400 hover:text-gray-600'
                        )}
                    >
                        {category.name}
                        {selectedCategory === category.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-black" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
