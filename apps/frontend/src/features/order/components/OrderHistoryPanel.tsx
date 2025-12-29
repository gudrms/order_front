'use client';

import { useUIStore } from '@/stores/uiStore';
import { useTableStore } from '@/stores/tableStore';
import { useOrdersByTable } from '@/hooks/queries/useOrders';
import { OrderHistoryCard } from './OrderHistoryCard';
import { Spinner } from '@/components/ui/Spinner';

/**
 * OrderHistoryPanel 컴포넌트
 * 우측 고정 주문내역 패널
 * - 슬라이드 인/아웃 애니메이션
 * - 테이블별 주문 내역 목록
 * - 주문 상태 표시
 */
export function OrderHistoryPanel() {
  const { isOrderHistoryOpen, toggleOrderHistory } = useUIStore();
  const { tableNumber } = useTableStore();

  // 테이블별 주문 내역 조회
  const { data: orders, isLoading } = useOrdersByTable(tableNumber ?? undefined);

  // 전체 총액 계산
  const totalAmount = orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;

  return (
    <>
      {/* 우측 고정 패널 - 슬라이드 애니메이션 */}
      <div
        className={`fixed right-0 top-0 z-40 flex h-screen w-96 flex-col bg-white shadow-lg transition-transform duration-300 ${
          isOrderHistoryOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold">📋 주문내역</h2>
          {/* 닫기 버튼 */}
          <button
            onClick={toggleOrderHistory}
            className="text-2xl text-gray-400 transition-colors hover:text-gray-600"
            aria-label="주문내역 닫기"
          >
            ×
          </button>
        </div>

        {/* 주문 목록 (스크롤) */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <div className="mb-4 text-6xl">📝</div>
              <p>주문 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderHistoryCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* 하단: 전체 총액 */}
        <div className="border-t bg-white p-4">
          {orders && orders.length > 0 && (
            <div className="mb-3 rounded-lg bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-700">
                  전체 주문 총액
                </span>
                <span className="text-2xl font-bold text-primary">
                  {totalAmount.toLocaleString()}원
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                총 {orders.length}건의 주문
              </p>
            </div>
          )}
          <p className="text-center text-sm text-gray-600">
            💡 주문 상태는 자동으로 업데이트됩니다
          </p>
        </div>
      </div>

      {/* 주문내역 닫혔을 때 열기 버튼 (선택사항) */}
      {!isOrderHistoryOpen && (
        <button
          onClick={toggleOrderHistory}
          className="fixed right-4 top-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-2xl text-white shadow-lg transition-transform hover:scale-110"
          aria-label="주문내역 열기"
        >
          📋
        </button>
      )}
    </>
  );
}
