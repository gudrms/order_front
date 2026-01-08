'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ORDER_STATUS_LABEL, 
  ORDER_STATUS_COLOR,
  Order, 
  OrderStatus,
  formatCurrency, 
  formatDate
} from '@order/shared';
import { Badge } from '@order/ui';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  XCircle, 
  MoreVertical 
} from 'lucide-react';

import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

export default function OrdersPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const storeId = 'store-1'; // 임시: 나중에 선택 가능하도록 변경

  // 실시간 주문 구독
  useRealtimeOrders(storeId);
  
  // 1. 주문 목록 조회
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders', storeId],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stores/${storeId}/orders`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      // 백엔드 응답 구조에 따라 data.data 또는 data를 사용
      return response.data.data || response.data;
    },
    enabled: !!session,
  });

  // 2. 주문 상태 변경 Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/stores/${storeId}/orders/${orderId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
    },
  });

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CONFIRMED': return <CheckCircle2 className="w-4 h-4" />;
      case 'COOKING': return <ChefHat className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'COOKING': return 'orange';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) return <div className="flex justify-center py-12">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">주문 관리</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-white">전체 {orders?.length ?? 0}건</Badge>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">주문 번호</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">테이블</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">주문 내역</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">합계</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">시간</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">상태</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-lg">{order.tableNumber ?? '-'}번</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-800">
                      {order.items.map(item => (
                        <div key={item.id}>
                          {item.menuName} x {item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(order.totalPrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getBadgeVariant(order.status)} className="gap-1">
                      {getStatusIcon(order.status)}
                      {ORDER_STATUS_LABEL[order.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'CONFIRMED' })}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
                        >
                          접수
                        </button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'COOKING' })}
                          className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-md hover:bg-orange-600"
                        >
                          조리 시작
                        </button>
                      )}
                      {(order.status === 'COOKING' || order.status === 'CONFIRMED') && (
                        <button 
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'COMPLETED' })}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700"
                        >
                          완료
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    현재 주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
