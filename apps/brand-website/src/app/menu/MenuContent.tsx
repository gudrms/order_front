'use client';

import { useEffect, useState } from 'react';
import ScrollAnimation from '@/components/ScrollAnimation';

interface BrandMenuCategory {
    id: string;
    name: string;
    displayOrder: number;
    isActive: boolean;
}

interface BrandMenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    categoryId: string;
    isFeatured: boolean;
    isActive: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tacomole.kr/api/v1';
const SPICY_KEYWORDS = ['스파이시', '매운', '핫', 'spicy', '불닭', '매워'];

function unwrapList<T>(json: unknown): T[] {
    if (Array.isArray(json)) return json as T[];
    if (json && typeof json === 'object' && 'data' in json) {
        const data = (json as { data?: unknown }).data;
        return Array.isArray(data) ? (data as T[]) : [];
    }
    return [];
}

function isSpicy(name: string, desc: string | null): boolean {
    const text = `${name} ${desc ?? ''}`.toLowerCase();
    return SPICY_KEYWORDS.some((keyword) => text.includes(keyword));
}

export default function MenuContent() {
    const [categories, setCategories] = useState<BrandMenuCategory[]>([]);
    const [menuItems, setMenuItems] = useState<BrandMenuItem[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetch(`${API_URL}/brand-menus/categories`)
            .then((response) => response.json())
            .then((json) => {
                const sorted = unwrapList<BrandMenuCategory>(json).sort(
                    (a, b) => a.displayOrder - b.displayOrder,
                );
                setCategories(sorted);
                setActiveCategory(sorted[0]?.id ?? '');
            })
            .catch(() => {
                setCategories([]);
                setActiveCategory('');
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!activeCategory) {
            setMenuItems([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        fetch(`${API_URL}/brand-menus?categoryId=${encodeURIComponent(activeCategory)}`)
            .then((response) => response.json())
            .then((json) => setMenuItems(unwrapList<BrandMenuItem>(json)))
            .catch(() => setMenuItems([]))
            .finally(() => setIsLoading(false));
    }, [activeCategory]);

    return (
        <main className="min-h-screen bg-white text-brand-black pt-10 pb-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-black mb-4">MENU</h1>
                    <p className="text-gray-600">타코몰리의 대표 메뉴를 만나보세요.</p>
                </div>

                {categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                                    activeCategory === category.id
                                        ? 'bg-brand-black text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse"
                            >
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

                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {menuItems.map((item, index) => (
                            <ScrollAnimation key={item.id} delay={index * 0.05}>
                                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-brand-yellow hover:shadow-lg transition-all group">
                                    <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                        {item.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-brand-green text-lg font-black">TACO MOLE</span>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2 gap-4">
                                            <h3 className="text-xl font-bold text-brand-black group-hover:text-brand-green transition-colors">
                                                {item.name}
                                            </h3>
                                            <span className="text-brand-black font-bold text-lg shrink-0">
                                                {item.price.toLocaleString()}원
                                            </span>
                                        </div>

                                        {item.description && (
                                            <p className="text-gray-500 text-sm mb-3 min-h-[40px] line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}

                                        {isSpicy(item.name, item.description) && (
                                            <span className="text-red-500 text-xs">매운맛</span>
                                        )}
                                    </div>
                                </div>
                            </ScrollAnimation>
                        ))}

                        {menuItems.length === 0 && (
                            <p className="col-span-full text-center text-gray-400 py-16">
                                브랜드 메뉴 정보가 아직 등록되지 않았습니다.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
