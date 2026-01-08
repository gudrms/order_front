'use client';

import { cn } from '@/lib/utils';
import { useCategories } from '../../hooks/queries/useMenus';
import { useUIStore } from '../../stores/uiStore';

export default function CategoryTabs() {
    const { selectedCategory, setSelectedCategory } = useUIStore();
    const { data: categories } = useCategories();

    // 데이터가 없을 때를 대비한 기본 카테고리 (로딩 중 등)
    const displayCategories = categories || [];

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
