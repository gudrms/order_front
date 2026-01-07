'use client';

import Image from 'next/image';
import type { Menu } from '@order/shared';

interface MenuCardProps {
  menu: Menu;
  onClick: (menuId: string) => void; // UUID
}

/**
 * MenuCard 컴포넌트
 * 개별 메뉴를 카드 형태로 표시
 * - 메뉴 이미지, 이름, 가격
 * - 품절 상태 처리
 * - 클릭 시 상세 패널 열기
 */
export function MenuCard({ menu, onClick }: MenuCardProps) {
  const handleClick = () => {
    if (!menu.soldOut) {
      onClick(menu.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={menu.soldOut}
      className={`w-full overflow-hidden rounded-lg border bg-white transition-all duration-200 ${
        menu.soldOut
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'
      } `}
    >
      {/* 메뉴 이미지 */}
      <div className="relative aspect-square w-full bg-gray-100">
        {menu.imageUrl ? (
          <Image
            src={menu.imageUrl}
            alt={menu.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <span className="text-4xl">🍽️</span>
          </div>
        )}

        {/* 품절 뱃지 */}
        {menu.soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white px-4 py-2 font-bold text-gray-900">
              품절
            </span>
          </div>
        )}
      </div>

      {/* 메뉴 정보 */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 font-semibold text-gray-900">
          {menu.name}
        </h3>
        {menu.description && (
          <p className="mb-2 line-clamp-2 text-sm text-gray-500">
            {menu.description}
          </p>
        )}
        <p className="text-primary text-lg font-bold">
          {menu.price.toLocaleString()}원
        </p>
      </div>
    </button>
  );
}
