'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMenuDetail } from '@/hooks/queries/useMenus';
import { useCartStore, useUIStore } from '@/stores';
import type { CartSelectedOption } from '@/types';

interface MenuDetailContentProps {
  menuId: string; // UUID
}

/**
 * MenuDetailContent 컴포넌트
 * 메뉴 상세 정보 및 장바구니 담기
 */
export function MenuDetailContent({ menuId }: MenuDetailContentProps) {
  const { data: menu, isLoading } = useMenuDetail(menuId);
  const addItem = useCartStore((state) => state.addItem);
  const closeMenuDetail = useUIStore((state) => state.closeMenuDetail);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<CartSelectedOption[]>(
    []
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-gray-400">메뉴 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-gray-400">메뉴를 찾을 수 없습니다.</div>
      </div>
    );
  }

  // 옵션 가격 합계
  const optionsPrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
  // 개당 가격 (기본 가격 + 옵션 가격)
  const unitPrice = menu.price + optionsPrice;
  // 총 가격
  const totalPrice = unitPrice * quantity;

  // 수량 증가
  const handleIncrement = () => {
    setQuantity((q) => q + 1);
  };

  // 수량 감소
  const handleDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  // 장바구니에 담기
  const handleAddToCart = () => {
    addItem({
      menuId: menu.id,
      menuName: menu.name,
      basePrice: menu.price,
      quantity,
      options: selectedOptions.length > 0 ? selectedOptions : undefined,
      imageUrl: menu.imageUrl,
    });

    // 메뉴 상세 모달 닫기
    closeMenuDetail();

    // 상태 초기화
    setQuantity(1);
    setSelectedOptions([]);
  };

  // 옵션 선택 처리 (간단 버전 - 실제로는 더 복잡)
  const handleOptionToggle = (option: CartSelectedOption) => {
    const exists = selectedOptions.find((opt) => opt.itemId === option.itemId);

    if (exists) {
      // 이미 선택됨 → 제거
      setSelectedOptions((opts) =>
        opts.filter((opt) => opt.itemId !== option.itemId)
      );
    } else {
      // 추가
      setSelectedOptions((opts) => [...opts, option]);
    }
  };

  return (
    <div className="p-6">
      {/* 메뉴 이미지 */}
      <div className="relative mb-6 aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {menu.imageUrl ? (
          <Image
            src={menu.imageUrl}
            alt={menu.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
      </div>

      {/* 메뉴 정보 */}
      <h3 className="mb-2 text-2xl font-bold text-gray-900">{menu.name}</h3>
      {menu.description && (
        <p className="mb-4 text-gray-600">{menu.description}</p>
      )}
      <p className="text-primary mb-6 text-2xl font-bold">
        {menu.price.toLocaleString()}원
      </p>

      {/* 옵션 선택 (간단 버전 - 실제로는 옵션 그룹별로 분리) */}
      {menu.options && menu.options.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 font-semibold text-gray-900">옵션 선택</h4>
          <div className="space-y-2">
            {menu.options.map((optionGroup) =>
              optionGroup.items.map((item) => {
                const isSelected = selectedOptions.some(
                  (opt) => opt.itemId === item.id
                );
                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleOptionToggle({
                        id: optionGroup.id,
                        itemId: item.id,
                        name: item.name,
                        price: item.price,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    } `}
                  >
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-gray-900">
                      +{item.price.toLocaleString()}원
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 수량 조절 */}
      <div className="mb-6 flex items-center justify-between border-b pb-6">
        <span className="font-medium text-gray-900">수량</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-900 text-gray-900 transition-colors hover:bg-gray-50"
          >
            −
          </button>
          <span className="w-12 text-center text-lg font-semibold text-gray-900">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-900 text-gray-900 transition-colors hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* 총 금액 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xl font-bold">
          <span className="text-gray-900">총 금액</span>
          <span className="text-primary">{totalPrice.toLocaleString()}원</span>
        </div>
      </div>

      {/* 장바구니 담기 버튼 */}
      <button
        onClick={handleAddToCart}
        disabled={menu.soldOut}
        className={`w-full rounded-lg py-4 text-lg font-bold transition-colors ${
          menu.soldOut
            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-primary text-primary-foreground hover:opacity-90'
        } `}
      >
        {menu.soldOut ? '품절' : '장바구니 담기'}
      </button>
    </div>
  );
}
