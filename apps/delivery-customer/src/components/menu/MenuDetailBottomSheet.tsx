'use client';

import { useCartStore, useMenuSelection } from '@order/shared';
import { MenuOptionList } from '@order/ui';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMenuDetail } from '../../hooks/queries/useMenus';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '@/lib/utils';

export default function MenuDetailBottomSheet() {
    const { selectedMenuId, setSelectedMenuId } = useUIStore();
    const addItem = useCartStore((state) => state.addItem);
    const [isClosing, setIsClosing] = useState(false);

    // 메뉴 상세 정보 조회
    const { data: menu, isLoading } = useMenuDetail(selectedMenuId || '');

    // 공통 훅 사용 (수량, 옵션, 가격 계산 로직)
    const {
        quantity,
        selectedOptions,
        totalPrice,
        increaseQuantity,
        decreaseQuantity,
        toggleOption,
        resetSelection,
    } = useMenuSelection({ menu });

    // 메뉴가 바뀌거나 닫힐 때 선택 상태 초기화
    useEffect(() => {
        if (selectedMenuId) {
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
            resetSelection();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedMenuId, resetSelection]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setSelectedMenuId(null);
            setIsClosing(false);
        }, 300);
    };

    const handleAddToCart = () => {
        if (!menu) return;

        addItem({
            menuId: menu.id,
            menuName: menu.name,
            basePrice: menu.price,
            quantity,
            options: selectedOptions,
            imageUrl: menu.imageUrl,
        });

        handleClose();
        // TODO: Toast 알림
        console.log('장바구니 담기 완료');
    };

    if (!selectedMenuId && !isClosing) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/50 transition-opacity duration-300",
                    isClosing ? "opacity-0" : "opacity-100"
                )}
                onClick={handleClose}
            />

            {/* Sheet */}
            <div
                className={cn(
                    "relative w-full max-w-[568px] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 transform flex flex-col max-h-[90vh]",
                    isClosing ? "translate-y-full" : "translate-y-0"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="font-bold text-lg">메뉴 상세</h2>
                    <button onClick={handleClose} className="p-2 -mr-2 text-gray-500">
                        <ChevronDown size={24} />
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="overflow-y-auto p-4 flex-1">
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500">
                            불러오는 중...
                        </div>
                    ) : menu ? (
                        <div className="space-y-6 pb-24">
                            {/* Image */}
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={menu.imageUrl || 'https://via.placeholder.com/300'}
                                    alt={menu.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Info */}
                            <div>
                                <h3 className="text-2xl font-bold text-brand-black mb-2">{menu.name}</h3>
                                <p className="text-gray-500">{menu.description}</p>
                                <p className="text-xl font-bold text-brand-black mt-2">
                                    {menu.price.toLocaleString()}원
                                </p>
                            </div>

                            {/* Options */}
                            {menu.optionGroups && (
                                <MenuOptionList
                                    optionGroups={menu.optionGroups}
                                    selectedOptions={selectedOptions}
                                    onOptionToggle={toggleOption}
                                />
                            )}

                            {/* Quantity */}
                            <div className="flex items-center justify-between py-4 border-t border-gray-100">
                                <span className="font-bold text-lg">수량</span>
                                <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-2">
                                    <button onClick={decreaseQuantity} disabled={quantity <= 1} className="p-1">
                                        <Minus size={20} />
                                    </button>
                                    <span className="font-bold text-xl w-8 text-center">{quantity}</span>
                                    <button onClick={increaseQuantity} className="p-1">
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            메뉴 정보를 찾을 수 없습니다.
                        </div>
                    )}
                </div>

                {/* Footer (Fixed) */}
                <div className="p-4 border-t border-gray-100 bg-white pb-8 flex-shrink-0">
                    <button
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold text-lg flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleAddToCart}
                        disabled={!menu || menu.soldOut}
                    >
                        <span>{menu?.soldOut ? '품절' : '장바구니 담기'}</span>
                        <span>{totalPrice.toLocaleString()}원</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
