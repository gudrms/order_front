import type { CartSelectedOption } from '@order/shared';

export interface CartItemCardProps {
  menuName: string;
  quantity: number;
  totalPrice: number;
  options?: CartSelectedOption[];
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

/**
 * CartItemCard Presenter 컴포넌트 (순수 UI)
 *
 * Container로부터 데이터와 콜백을 받아 UI만 렌더링합니다.
 * Zustand나 다른 비즈니스 로직에 의존하지 않아 테스트가 용이합니다.
 *
 * @param menuName - 메뉴 이름
 * @param quantity - 수량
 * @param totalPrice - 총 가격
 * @param options - 선택된 옵션 목록
 * @param onIncrease - 수량 증가 핸들러
 * @param onDecrease - 수량 감소 핸들러
 * @param onRemove - 삭제 핸들러
 */
export function CartItemCard({
  menuName,
  quantity,
  totalPrice,
  options,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemCardProps) {
  return (
    <div className="mb-3 rounded-lg border bg-white p-3">
      {/* 상단: 이름 + X 버튼 (한 줄) */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{menuName}</h3>
        <button
          onClick={onRemove}
          className="ml-2 text-gray-400 transition-colors hover:text-red-500"
          aria-label="삭제"
        >
          ✕
        </button>
      </div>

      {/* 선택된 옵션 */}
      {options && options.length > 0 && (
        <div className="mb-2">
          {options.map((option, index) => (
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
            onClick={onDecrease}
            className="flex h-8 w-8 items-center justify-center rounded border transition-colors hover:bg-gray-100"
            aria-label="수량 감소"
          >
            <span className="text-lg">-</span>
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button
            onClick={onIncrease}
            className="flex h-8 w-8 items-center justify-center rounded border transition-colors hover:bg-gray-100"
            aria-label="수량 증가"
          >
            <span className="text-lg">+</span>
          </button>
        </div>

        {/* 가격 */}
        <p className="font-semibold text-gray-900">
          {totalPrice.toLocaleString()}원
        </p>
      </div>
    </div>
  );
}
