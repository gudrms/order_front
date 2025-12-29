'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUIStore, useTableStore, useCartStore } from '@/stores';
import { useMenus } from '@/hooks/queries/useMenus';
import {
  TopBar,
  Sidebar,
  BottomBar,
  DetailPanel,
} from '@/features/menu/layout';
import { MenuGrid } from '@/features/menu/components';
import { CartPanel } from '@/features/cart';
import { MenuDetailModal } from '@/features/menu/components/MenuDetailModal';

/**
 * useSearchParams를 사용하는 컴포넌트
 */
function MenuContent() {
  // URL Query Parameter
  const searchParams = useSearchParams();
  const { setTableNumber } = useTableStore();

  // 현재 활성화된 카테고리 (Intersection Observer가 자동으로 감지)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Stores
  const { openMenuDetail, openCart, isCartOpen } = useUIStore();
  const { addItem } = useCartStore();

  // 메뉴 데이터
  const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'default-store-id';
  const { data: menus } = useMenus(storeId);

  /**
   * URL에서 테이블 번호 읽어서 Store에 저장
   */
  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      const tableNum = parseInt(table, 10);
      if (!isNaN(tableNum) && tableNum > 0) {
        setTableNumber(tableNum);
      }
    } else {
      // 개발용 기본값 (QR 없이 접근 시)
      setTableNumber(5);
    }
  }, [searchParams, setTableNumber]);

  /**
   * 카테고리 클릭 시 해당 섹션으로 스크롤 이동
   */
  const handleCategoryClick = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  /**
   * 활성 카테고리 변경 시 (Intersection Observer)
   */
  const handleCategoryActive = (categoryId: string) => {
    setActiveCategoryId(categoryId);
  };

  /**
   * 메뉴 클릭 핸들러
   * - 옵션이 있으면: 상세 모달 열기
   * - 옵션이 없으면: 바로 장바구니에 추가
   */
  const handleMenuClick = useCallback(
    (menuId: string) => {
      // 메뉴 찾기
      const menu = menus?.find((m) => m.id === menuId);
      if (!menu) {
        console.error('메뉴를 찾을 수 없습니다:', menuId);
        return;
      }

      // 옵션 유무 확인
      const hasOptions = menu.options && menu.options.length > 0;

      if (hasOptions) {
        // 옵션 있음 → 상세 모달 열기
        openMenuDetail(menuId);
      } else {
        // 옵션 없음 → 바로 장바구니에 추가
        addItem({
          menuId: menu.id,
          menuName: menu.name,
          basePrice: menu.price,
          quantity: 1,
          imageUrl: menu.imageUrl,
          options: [],
        });

        // 장바구니가 닫혀있으면 열기
        if (!isCartOpen) {
          openCart();
        }
      }
    },
    [menus, openMenuDetail, addItem, openCart, isCartOpen]
  );

  return (
      <>
        {/* 메인 레이아웃 */}
        <div className="flex h-screen bg-gray-50">
          {/* 좌측 사이드바 */}
          <Sidebar
              activeCategoryId={activeCategoryId}
              onCategoryClick={handleCategoryClick}
          />

          {/* 중앙 메인 컨텐츠 */}
          <div className="flex flex-1 flex-col">
            {/* 상단 바 */}
            <TopBar
                activeCategoryId={activeCategoryId}
                onCategoryClick={handleCategoryClick}
            />

            {/* 메뉴 그리드 (스크롤 영역) */}
            <div className="flex-1 overflow-auto">
              <MenuGrid
                  onCategoryActive={handleCategoryActive}
                  onMenuClick={handleMenuClick}
              />
            </div>

            {/* 하단 바 */}
            <BottomBar />
          </div>
        </div>

        {/* 메뉴 상세 모달 (중앙) */}
        <MenuDetailModal />

        {/* 우측 상세 패널 (직원 호출 등) */}
        <DetailPanel />

        {/* 우측 장바구니 패널 */}
        <CartPanel />
      </>
  );
}

/**
 * 고객용 메뉴 페이지
 * - 스크롤 네비게이션 방식
 * - 카테고리별 섹션으로 구성
 * - 자동 활성 섹션 추적
 * - URL Query Parameter에서 테이블 번호 읽기 (?table=5)
 */
export default function MenuPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MenuContent />
    </Suspense>
  );
}
