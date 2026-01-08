'use client';

import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useMenus } from '../../hooks/queries/useMenus';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '@order/shared';

export default function MenuList() {
    const selectedCategory = useUIStore((state) => state.selectedCategory);
    const setSelectedMenuId = useUIStore((state) => state.setSelectedMenuId);

    // 전체 메뉴 조회 (Client-side Filtering을 위해 categoryId 없이 호출)
    const { data: allMenus, isLoading } = useMenus();

    // useMemo를 사용하여 필터링 로직 최적화
    const filteredMenus = useMemo(() => {
        if (!allMenus) return [];
        if (selectedCategory === 'ALL') return allMenus;
        return allMenus.filter((menu) => menu.categoryId === selectedCategory);
    }, [allMenus, selectedCategory]);

    const handleMenuClick = (menuId: string) => {
        setSelectedMenuId(menuId);
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center text-gray-500">
                메뉴를 불러오는 중...
            </div>
        );
    }

    if (!filteredMenus || filteredMenus.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                등록된 메뉴가 없습니다.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            {filteredMenus.map((item) => (
                <div
                    key={item.id}
                    className="flex gap-4 cursor-pointer"
                    onClick={() => !item.soldOut && handleMenuClick(item.id)}
                >
                    {/* Image */}
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.imageUrl || 'https://via.placeholder.com/150'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                        {item.soldOut && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">
                                품절
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <h3 className="font-bold text-lg text-brand-black leading-tight mb-1">
                                {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-lg text-brand-black">
                                {item.price.toLocaleString()}원
                            </span>
                            <button
                                disabled={item.soldOut}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick(item.id);
                                }}
                                className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center hover:bg-brand-green hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
