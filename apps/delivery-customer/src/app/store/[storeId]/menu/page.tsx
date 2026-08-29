'use client';

import { ChevronLeft, Search, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryTabs from '@/components/menu/CategoryTabs';
import MenuList from '@/components/menu/MenuList';
import CartBottomSheet from '@/components/cart/CartBottomSheet';
import MenuDetailBottomSheet from '@/components/menu/MenuDetailBottomSheet';
import SiteFooter from '@/components/SiteFooter';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useCartStore } from '@order/order-core';

export default function MenuPage() {
    const router = useRouter();
    const { store } = useCurrentStore();
    const totalQuantity = useCartStore((s) => s.totalQuantity);
    const totalPrice = useCartStore((s) => s.totalPrice);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const handleProceedToOrder = () => {
        router.push(`/store/${store.id}/order/checkout`);
    };

    return (
        <main className="min-h-screen bg-white pb-28">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 pt-safe">
                <div className="flex items-center justify-between px-4 h-14">
                    <Link href="/" className="p-2 -ml-2 text-brand-black">
                        <ChevronLeft size={24} />
                    </Link>
                    <div className="min-w-0 text-center">
                        <h1 className="font-bold text-lg truncate">{store.name}</h1>
                        {!store.isDeliveryEnabled && (
                            <p className="text-xs text-red-500">현재 배달 주문을 받지 않습니다.</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-brand-black" aria-label="메뉴 검색">
                            <Search size={24} />
                        </button>
                        <button
                            className="p-2 -mr-2 text-brand-black relative"
                            onClick={() => setIsCartOpen(true)}
                            aria-label="장바구니 열기"
                        >
                            <ShoppingBag size={24} />
                            {totalQuantity > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-yellow rounded-full text-[10px] font-bold flex items-center justify-center">
                                    {totalQuantity}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <CategoryTabs />
            <MenuList />

            <p className="px-4 py-3 text-xs leading-relaxed text-gray-500 bg-gray-50 border-t border-gray-100">
                {store.estimatedDeliveryMinutes
                    ? `예상 배달 시간: 약 ${store.estimatedDeliveryMinutes}분 (주문 당일 수령). `
                    : '결제 완료 후 조리를 시작하며 주문 당일 수령합니다. '}
                매장 상황·주문량·배달 거리에 따라 달라질 수 있습니다.
            </p>

            <SiteFooter />

            {totalQuantity > 0 && (
                <div className="fixed bottom-6 left-4 right-4 z-40 max-w-[568px] mx-auto">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-brand-black text-white p-4 rounded-2xl flex items-center justify-between shadow-xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-yellow text-brand-black font-bold flex items-center justify-center">
                                {totalQuantity}
                            </div>
                            <span className="font-bold">{totalPrice.toLocaleString()}원</span>
                        </div>
                        <span className="font-bold text-brand-yellow">주문하기</span>
                    </button>
                </div>
            )}

            <CartBottomSheet
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onProceedToOrder={handleProceedToOrder}
            />
            <MenuDetailBottomSheet />
        </main>
    );
}
