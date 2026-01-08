'use client';

import { useCartStore } from '@order/shared';
import { CartItemCard } from '@order/ui';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import AddressInputBottomSheet from '../order/AddressInputBottomSheet';

interface CartBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onProceedToOrder: () => void;
}

const MINIMUM_ORDER_AMOUNT = 15000;

export default function CartBottomSheet({ isOpen, onClose, onProceedToOrder }: CartBottomSheetProps) {
    const { items, totalPrice, updateQuantity, removeItem } = useCartStore();
    const [isClosing, setIsClosing] = useState(false);
    const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    const handleOrder = () => {
        // 최소 주문 금액 확인
        if (totalPrice < MINIMUM_ORDER_AMOUNT) {
            alert(`최소 주문 금액은 ${MINIMUM_ORDER_AMOUNT.toLocaleString()}원입니다.`);
            return;
        }

        // 배달 정보 입력으로 이동
        setIsAddressSheetOpen(true);
    };

    const handleAddressConfirm = () => {
        setIsAddressSheetOpen(false);
        handleClose();
        // 결제 페이지로 이동
        onProceedToOrder();
    };

    if (!isOpen && !isClosing) return null;

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
                    "relative w-full max-w-[568px] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 transform",
                    isClosing ? "translate-y-full" : "translate-y-0"
                )}
                style={{ maxHeight: '80vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="font-bold text-lg">장바구니</h2>
                    <button onClick={handleClose} className="p-2 -mr-2 text-gray-500">
                        <ChevronDown size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                    {items.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            장바구니가 비어있습니다.
                        </div>
                    ) : (
                        items.map((item) => (
                            <CartItemCard
                                key={item.id}
                                name={item.menuName}
                                price={item.totalPrice}
                                quantity={item.quantity}
                                options={item.options}
                                imageUrl={item.imageUrl}
                                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                                onDecrease={() => {
                                    if (item.quantity > 1) {
                                        updateQuantity(item.id, item.quantity - 1);
                                    } else {
                                        if (confirm('삭제하시겠습니까?')) removeItem(item.id);
                                    }
                                }}
                                onRemove={() => {
                                    if (confirm('삭제하시겠습니까?')) removeItem(item.id);
                                }}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white pb-8">
                    {totalPrice < MINIMUM_ORDER_AMOUNT && items.length > 0 && (
                        <p className="text-sm text-red-500 mb-2 text-center">
                            최소 주문 금액 {MINIMUM_ORDER_AMOUNT.toLocaleString()}원 미만입니다.
                            ({(MINIMUM_ORDER_AMOUNT - totalPrice).toLocaleString()}원 부족)
                        </p>
                    )}
                    <button
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold text-lg flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={items.length === 0}
                        onClick={handleOrder}
                    >
                        <span>{items.length}개 주문하기</span>
                        <span>{totalPrice.toLocaleString()}원</span>
                    </button>
                </div>
            </div>

            {/* 배달 주소 입력 */}
            <AddressInputBottomSheet
                isOpen={isAddressSheetOpen}
                onClose={() => setIsAddressSheetOpen(false)}
                onConfirm={handleAddressConfirm}
            />
        </div>
    );
}
