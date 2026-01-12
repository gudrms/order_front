'use client';

import { useState, useCallback } from 'react';
import type { Menu, CartSelectedOption } from '../types';

interface UseMenuSelectionProps {
    menu: Menu | undefined;
    initialQuantity?: number;
}

export function useMenuSelection({ menu, initialQuantity = 1 }: UseMenuSelectionProps) {
    const [quantity, setQuantity] = useState(initialQuantity);
    const [selectedOptions, setSelectedOptions] = useState<CartSelectedOption[]>([]);

    // 수량 증가
    const increaseQuantity = useCallback(() => {
        setQuantity((prev: number) => prev + 1);
    }, []);

    // 수량 감소
    const decreaseQuantity = useCallback(() => {
        setQuantity((prev: number) => Math.max(1, prev - 1));
    }, []);

    // 옵션 선택/해제 토글
    const toggleOption = useCallback((
        groupName: string,
        optionId: string,
        optionName: string,
        optionPrice: number,
        isMultiple: boolean = true // 다중 선택 가능 여부 (기본값 true, 라디오 버튼 등은 false 처리 필요)
    ) => {
        setSelectedOptions((prev: CartSelectedOption[]) => {
            const exists = prev.find((opt: CartSelectedOption) => opt.itemId === optionId);

            if (exists) {
                // 이미 선택된 경우 제거
                return prev.filter((opt: CartSelectedOption) => opt.itemId !== optionId);
            } else {
                // 선택되지 않은 경우 추가
                // 단일 선택(Radio)인 경우 같은 그룹의 다른 옵션 제거 로직이 필요할 수 있음
                // 현재는 간단히 추가만 구현
                return [
                    ...prev,
                    {
                        id: 'temp-id', // 실제로는 optionGroupId가 필요할 수 있음
                        groupName,
                        itemId: optionId,
                        itemName: optionName,
                        price: optionPrice,
                    },
                ];
            }
        });
    }, []);

    // 가격 계산
    const basePrice = menu?.price || 0;
    const optionsPrice = selectedOptions.reduce((sum: number, opt: CartSelectedOption) => sum + opt.price, 0);
    const unitPrice = basePrice + optionsPrice;
    const totalPrice = unitPrice * quantity;

    // 초기화
    const resetSelection = useCallback(() => {
        setQuantity(initialQuantity);
        setSelectedOptions([]);
    }, [initialQuantity]);

    return {
        quantity,
        selectedOptions,
        unitPrice,
        totalPrice,
        increaseQuantity,
        decreaseQuantity,
        toggleOption,
        resetSelection,
        setQuantity, // 필요 시 직접 설정
    };
}
