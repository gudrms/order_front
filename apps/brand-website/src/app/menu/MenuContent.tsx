'use client';

import { useState, useEffect } from 'react';
import ScrollAnimation from '@/components/ScrollAnimation';

interface Category {
    id: string;
    name: string;
    sortOrder: number;
}

interface MenuOption {
    id: string;
    name: string;
    price: number;
}

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
    categoryId: string;
    options?: MenuOption[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SPICY_KEYWORDS = ['스파이시', '매운', '핫', 'spicy', '불닭', '매콤'];

function isSpicy(name: string, desc: string | null): boolean {
    const text = `${name} ${desc ?? ''}`.toLowerCase();
    return SPICY_KEYWORDS.some((k) => text.includes(k));
}

export default function MenuContent() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [storeId, setStoreId] = useState<string>('');

    // 1) 첫 번째 활성 매장 조회
    useEffect(() => {
        fetch(`${API_URL}/stores`)
            .then((r) => r.json())
            .then((stores: Array<{ id: string; isActive: boolean }>) => {
                const active = stores.find((s) => s.isActive) ?? stores[0];
                if (active) setStoreId(active.id);
                else setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    // 2) 매장 확정 후 카테고리 로드
    useEffect(() => {
        if (!storeId) return;
        fetch(`${API_URL}/stores/${storeId}/categories`)
            .then((r) => r.json())
            .then((cats: Category[]) => {
                const sorted = [...cats].sort((a, b) => a.sortOrder - b.sortOrder);
                setCategories(sorted);
                if (sorted.length > 0) setActiveCategory(sorted[0].id);
            })
            .catch(() => setIsLoading(false));
    }, [storeId]);

    // 3) 카테고리 선택 시 메뉴 로드
    useEffect(() => {
        if (!storeId || !activeCategory) return;
        setIsLoading(true);
        fetch(`${API_URL}/stores/${storeId}/menus?categoryId=${activeCategory}`)
            .then((r) => r.json())
            .then((items: MenuItem[]) => {
                setMenuItems(items.filter((m) => m.isAvailable));
            })
            .catch(() => setMenuItems([]))
            .finally(() => setIsLoading(false));
    }, [storeId, activeCategory]);

    return (
        <main className="min-h-screen bg-white text-brand-black pt-10 pb-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-black mb-4">MENU</h1>
                    <p className="text-gray-600">타코몰리의 다양한 메뉴를 만나보세요.</p>
                </div>

                {/* Category Tabs */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                                    activeCategory === cat.id
                                        ? 'bg-brand-black text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-100" />
                                <div className="p-6">
                                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                                    <div className="h-4 bg-gray-100 rounded w-full mb-1" />
                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Menu Grid */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {menuItems.map((item, idx) => (
                            <ScrollAnimation key={item.id} delay={idx * 0.05}>
                                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-brand-yellow hover:shadow-lg transition-all group">
                                    {/* 이미지 */}
                                    <div className="h-48 bg-gray-50 flex items-center justify-center text-6xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                        {item.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            '🌮'
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-brand-black group-hover:text-brand-green transition-colors">
                                                {item.name}
                                            </h3>
                                            <span className="text-brand-black font-bold text-lg ml-2 shrink-0">
                                                {item.price.toLocaleString()}원
                                            </span>
                                        </div>

                                        {item.description && (
                                            <p className="text-gray-500 text-sm mb-3 min-h-[40px] line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}

                                        {isSpicy(item.name, item.description) && (
                                            <span className="text-red-500 text-xs">🌶️ 매운맛</span>
                                        )}
                                    </div>
                                </div>
                            </ScrollAnimation>
                        ))}

                        {menuItems.length === 0 && (
                            <p className="col-span-3 text-center text-gray-400 py-16">
                                메뉴 정보를 불러올 수 없습니다.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
