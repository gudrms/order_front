'use client';

import Image from 'next/image';
import { useCartStore } from '@/stores';
import type { CartItem } from '@/stores';

interface CartItemCardProps {
  item: CartItem;
}

/**
 * CartItemCard 컴포넌트
 * 장바구니 아이템 한 개를 표시하는 카드
 * - 메뉴 정보 (이름, 이미지)
 * - 선택된 옵션 목록
 * - 수량 조절 (+/-)
 * - 삭제 버튼 (X - 메뉴 이름 옆)
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
    } else {
      // 수량이 1일 때는 삭제 확인
      if (confirm(`${item.menuName}을(를) 삭제하시겠습니까?`)) {
        removeItem(item.id);
      }
    }
  };

  const handleRemove = () => {
    if (confirm(`${item.menuName}을(를) 삭제하시겠습니까?`)) {
      removeItem(item.id);
    }
  };

  return (
    <div className="mb-3 rounded-lg border bg-white p-3">
      {/* 상단: 이름 + X 버튼 (한 줄) */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{item.menuName}</h3>
        <button
          onClick={handleRemove}
          className="ml-2 text-gray-400 transition-colors hover:text-red-500"
          aria-label="삭제"
        >
          ✕
        </button>
      </div>

      {/* 선택된 옵션 */}
      {item.options && item.options.length > 0 && (
        <div className="mb-2">
          {item.options.map((option, index) => (
            <p key={index} className="text-xs text-gray-500">
              + {option.groupName}: {option.itemName}
              {option.price > 0 && ` (${option.price.toLocaleString()}원)`}
            </p>
          ))}
        </div>
      )}

      {/* 하단: 수량 조절 + 가격 */}
      <div className="flex items-center justify-between">
        {/* 수량 조절 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrease}
            className="flex h-8 w-8 items-center justify-center rounded border transition-colors hover:bg-gray-100"
            aria-label="수량 감소"
          >
            <span className="text-lg">-</span>
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={handleIncrease}
            className="flex h-8 w-8 items-center justify-center rounded border transition-colors hover:bg-gray-100"
            aria-label="수량 증가"
          >
            <span className="text-lg">+</span>
          </button>
        </div>

        {/* 가격 */}
        <p className="font-semibold text-gray-900">
          {item.totalPrice.toLocaleString()}원
        </p>
      </div>
    </div>
  );
}
