'use client';

import type { Order } from '@/lib/api/endpoints/order';
import { Badge } from '@/components/ui/Badge';

interface OrderHistoryCardProps {
  order: Order;
}

/**
 * 주문 상태에 따른 뱃지 스타일
 */
function getStatusBadge(status: Order['status']) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">접수 대기</Badge>;
    case 'COOKING':
      return <Badge variant="info">조리 중</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">완료</Badge>;
    case 'CANCELLED':
      return <Badge variant="error">취소됨</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

/**
 * OrderHistoryCard 컴포넌트
 * 개별 주문 내역을 카드 형태로 표시
 */
export function OrderHistoryCard({ order }: OrderHistoryCardProps) {
  const orderDate = new Date(order.createdAt);
  const timeString = orderDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* 헤더: 주문번호 + 상태 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {order.orderNumber}
          </span>
          {getStatusBadge(order.status)}
        </div>
        <span className="text-sm text-gray-500">{timeString}</span>
      </div>

      {/* 주문 아이템 목록 */}
      <div className="mb-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <div className="flex-1">
              <span className="text-gray-900">{item.menuName}</span>
              {item.options && item.options.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {item.options.map((option, idx) => (
                    <div key={idx} className="text-xs text-gray-500">
                      • {option.groupName}: {option.itemName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ml-4 flex items-center gap-2">
              <span className="text-gray-600">x{item.quantity}</span>
              <span className="font-medium text-gray-900">
                {item.totalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 총 금액 */}
      <div className="border-t pt-3">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">총 금액</span>
          <span className="text-lg font-bold text-primary">
            {order.totalAmount.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}
