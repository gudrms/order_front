'use client';

import Image from 'next/image';
import { useCartStore } from '@/stores';
import type { CartItem } from '@/stores/cartStore';

interface CartItemCardProps {
  item: CartItem;
}

/**
 * CartItemCard 컴포넌트
 * 장바구니 아이템 한 개를 표시하는 카드
 * - 메뉴 정보 (이름, 이미지)
 * - 선택된 옵션 목록
 * - 수량 조절 (+/-)
 * - 삭제 버튼
 * - 가격 표시
 */
export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleIncrease = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    if (confirm(`${item.menuName}을(를) 삭제하시겠습니까?`)) {
      removeItem(item.id);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        {/* 메뉴 이미지 */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.menuName}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
        </div>

        {/* 메뉴 정보 */}
        <div className="min-w-0 flex-1">
          {/* 메뉴 이름 */}
          <h3 className="mb-1 font-semibold text-gray-900">{item.menuName}</h3>

          {/* 선택된 옵션 */}
          {item.options && item.options.length > 0 && (
            <div className="mb-2">
              {item.options.map((option, index) => (
                <p key={index} className="text-sm text-gray-600">
                  - {option.name}
                  {option.price > 0 && (
                    <span className="text-gray-500">
                      {' '}
                      (+{option.price.toLocaleString()}원)
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}

          {/* 가격 정보 */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {item.unitPrice.toLocaleString()}원
            </span>
            <span className="text-sm text-gray-400">x {item.quantity}</span>
            <span className="text-primary font-bold">
              = {item.totalPrice.toLocaleString()}원
            </span>
          </div>

          {/* 수량 조절 & 삭제 */}
          <div className="flex items-center gap-2">
            {/* 수량 조절 버튼 */}
            <div className="flex items-center rounded-lg border">
              <button
                onClick={handleDecrease}
                className="px-3 py-1 transition-colors hover:bg-gray-100"
                disabled={item.quantity <= 1}
              >
                <span className="text-lg">-</span>
              </button>
              <span className="min-w-[40px] px-4 py-1 text-center font-medium">
                {item.quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="px-3 py-1 transition-colors hover:bg-gray-100"
              >
                <span className="text-lg">+</span>
              </button>
            </div>

            {/* 삭제 버튼 */}
            <button
              onClick={handleRemove}
              className="rounded-lg px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
