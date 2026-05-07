'use client';

import { ChevronLeft, Search, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryTabs from '@/components/menu/CategoryTabs';
import MenuList from '@/components/menu/MenuList';
import CartBottomSheet from '@/components/cart/CartBottomSheet';
import MenuDetailBottomSheet from '@/components/menu/MenuDetailBottomSheet';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useCartStore } from '@order/shared/stores/cartStore';

export default function MenuPage() {
    const router = useRouter();
    const { store, isLoading, error } = useCurrentStore();
    const { totalQuantity, totalPrice } = useCartStore();
    const [isCartOpen, setIsCartOpen] = useState(false);

    const handleProceedToOrder = () => {
        router.push('/order/checkout');
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center text-gray-500">
                매장 정보를 불러오는 중...
            </main>
        );
    }

    if (error || !store) {
        return (
            <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="font-bold text-lg">매장을 찾을 수 없습니다.</p>
                <p className="text-sm text-gray-500">매장 주소나 환경변수 설정을 확인해 주세요.</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
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
