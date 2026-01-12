'use client';

import { useState } from 'react';
import ScrollAnimation from '@/components/ScrollAnimation';

// Mock Data
const CATEGORIES = [
    { id: 'taco', name: '타코 (Taco)' },
    { id: 'burrito', name: '부리또 (Burrito)' },
    { id: 'quesadilla', name: '퀘사디아 (Quesadilla)' },
    { id: 'sides', name: '사이드 & 음료' },
];

const MENU_ITEMS = [
    {
        id: 1,
        category: 'taco',
        name: '비프 타코',
        description: '직화로 구운 소고기와 신선한 야채가 어우러진 정통 타코',
        image: '🌮',
        spicy: 1,
    },
    {
        id: 2,
        category: 'taco',
        name: '스파이시 포크 타코',
        description: '매콤한 제육볶음 스타일의 퓨전 타코',
        image: '🌮',
        spicy: 2,
    },
    {
        id: 3,
        category: 'taco',
        name: '쉬림프 타코',
        description: '탱글탱글한 새우와 상큼한 라임 소스의 조화',
        image: '🍤',
        spicy: 0,
    },
    {
        id: 4,
        category: 'burrito',
        name: '비프 부리또',
        description: '든든한 한 끼! 소고기, 라이스, 콩, 치즈가 듬뿍',
        image: '🌯',
        spicy: 1,
    },
    {
        id: 5,
        category: 'burrito',
        name: '치킨 부리또',
        description: '담백한 닭가슴살과 부드러운 소스의 만남',
        image: '🌯',
        spicy: 0,
    },
    {
        id: 6,
        category: 'quesadilla',
        name: '치즈 퀘사디아',
        description: '모짜렐라와 체다 치즈가 녹아내리는 고소한 맛',
        image: '🧀',
        spicy: 0,
    },
    {
        id: 7,
        category: 'quesadilla',
        name: '불고기 퀘사디아',
        description: '달콤짭짤한 불고기와 치즈의 환상 궁합',
        image: '🧀',
        spicy: 0,
    },
    {
        id: 8,
        category: 'sides',
        name: '나초 & 살사',
        description: '바삭한 나초칩과 매장에서 직접 만든 살사 소스',
        image: '🥨',
        spicy: 1,
    },
    {
        id: 9,
        category: 'sides',
        name: '감자튀김',
        description: '케이준 스타일의 바삭한 감자튀김',
        image: '🍟',
        spicy: 0,
    },
    {
        id: 10,
        category: 'sides',
        name: '탄산음료',
        description: '콜라 / 사이다 / 환타',
        image: '🥤',
        spicy: 0,
    },
];

export default function MenuPage() {
    const [activeCategory, setActiveCategory] = useState('taco');

    const filteredItems = MENU_ITEMS.filter(item => item.category === activeCategory);

    return (
        <main className="min-h-screen bg-white text-brand-black pt-10 pb-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-black mb-4">MENU</h1>
                    <p className="text-gray-600">타코몰리의 다양한 메뉴를 만나보세요.</p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-6 py-3 rounded-full font-bold transition-all ${activeCategory === cat.id
                                ? 'bg-brand-yellow text-brand-black scale-105 shadow-lg shadow-brand-yellow/20'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item, idx) => (
                        <ScrollAnimation key={item.id} delay={idx * 0.05}>
                            <div
                                className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-brand-yellow hover:shadow-lg transition-all group"
                            >
                                {/* Image Placeholder */}
                                <div className="h-48 bg-gray-50 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
                                    {item.image}
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-brand-black group-hover:text-brand-green transition-colors">
                                            {item.name}
                                        </h3>
                                    </div>

                                    <p className="text-gray-500 text-sm mb-4 min-h-[40px]">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center gap-2">
                                        {item.spicy > 0 && (
                                            <div className="flex gap-1">
                                                {[...Array(item.spicy)].map((_, i) => (
                                                    <span key={i} className="text-red-500 text-xs">🌶️</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollAnimation>
                    ))}
                </div>
            </div>
        </main>
    );
}
