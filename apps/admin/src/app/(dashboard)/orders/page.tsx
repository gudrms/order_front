'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CheckCircle2,
  ChefHat,
  Clock,
  MapPin,
  PackageCheck,
  Printer,
  Truck,
  XCircle,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABEL,
  type DeliveryStatus,
  type Order,
  type OrderStatus,
} from '@order/shared';
import { Badge } from '@order/ui';

import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { OrderReceipt } from '@/components/OrderReceipt';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const orderTypeLabel: Record<string, string> = {
  TABLE: '테이블',
  DELIVERY: '배달',
  TAKEOUT: '포장',
};

const sourceLabel: Record<string, string> = {
  TABLE_ORDER: '테이블오더',
  DELIVERY_APP: '배달앱',
  HOMEPAGE: '홈페이지',
  TOSS_POS: 'Toss POS',
  ADMIN: '관리자',
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: '결제 대기',
  READY: '결제 준비',
  PAID: '결제 완료',
  FAILED: '결제 실패',
  CANCELLED: '결제 취소',
  PARTIAL_REFUNDED: '부분 환불',
  REFUNDED: '환불 완료',
};

const deliveryStatusLabel: Record<DeliveryStatus, string> = {
  PENDING: '배달 대기',
  ASSIGNED: '라이더 배정',
  PICKED_UP: '픽업 완료',
  DELIVERING: '배달 중',
  DELIVERED: '배달 완료',
  FAILED: '배달 실패',
  CANCELLED: '배달 취소',
};

const deliveryStatusAction: Partial<Record<DeliveryStatus, {
  next: DeliveryStatus;
  label: string;
  className: string;
}>> = {
  PENDING: {
    next: 'ASSIGNED',
    label: '라이더 배정',
    className: 'bg-slate-800 hover:bg-slate-900',
  },
  ASSIGNED: {
    next: 'DELIVERING',
    label: '배달 시작',
    className: 'bg-indigo-600 hover:bg-indigo-700',
  },
  PICKED_UP: {
    next: 'DELIVERING',
    label: '배달 시작',
    className: 'bg-indigo-600 hover:bg-indigo-700',
  },
  DELIVERING: {
    next: 'DELIVERED',
    label: '배달 완료',
    className: 'bg-green-600 hover:bg-green-700',
  },
};

export default function OrdersPage() {
  const { session } = useAuth();
  const { selectedStore, selectedStoreId: storeId, isLoading: isStoresLoading, authHeaders } = useAdminStore();
  const queryClient = useQueryClient();
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  useRealtimeOrders(storeId || '');

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders', storeId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/stores/${storeId}/orders`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!session && !!storeId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      await axios.patch(
        `${API_URL}/stores/${storeId}/orders/${orderId}/status`,
        { status },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
    },
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      riderMemo,
    }: {
      orderId: string;
      status: DeliveryStatus;
      riderMemo?: string;
    }) => {
      await axios.patch(
        `${API_URL}/stores/${storeId}/orders/${orderId}/delivery-status`,
        { status, riderMemo },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
    },
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: async ({
      orderId,
      cancelReason,
      cancelAmount,
    }: {
      orderId: string;
      cancelReason: string;
      cancelAmount?: number;
    }) => {
      await axios.post(
        `${API_URL}/payments/orders/${orderId}/toss/cancel`,
        { cancelReason, cancelAmount },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
    },
  });

  const isLoading = isStoresLoading || isOrdersLoading;

  if (isLoading) {
    return <div className="flex justify-center py-12">주문을 불러오는 중...</div>;
  }

  if (!storeId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-gray-800">연결된 매장이 없습니다</h2>
        <p className="mt-2 text-sm text-gray-500">
          먼저 매장 등록 또는 사장님 초대코드 가입을 완료해주세요.
        </p>
      </div>
    );
  }

  const activeOrders = orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status));
  const deliveryOrders = orders.filter((order) => order.type === 'DELIVERY');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">주문 관리</h2>
          <p className="text-sm text-gray-500">
            {selectedStore?.name} {selectedStore?.branchName ? `· ${selectedStore.branchName}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-white">전체 {orders.length}건</Badge>
          <Badge variant="warning">진행 중 {activeOrders.length}건</Badge>
          <Badge variant="info">배달 {deliveryOrders.length}건</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="접수 대기" value={orders.filter((order) => ['PENDING', 'PAID'].includes(order.status)).length} />
        <SummaryCard label="조리/준비" value={orders.filter((order) => ['CONFIRMED', 'COOKING', 'PREPARING', 'READY'].includes(order.status)).length} />
        <SummaryCard label="배달 중" value={orders.filter((order) => order.delivery?.status === 'DELIVERING').length} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <TableHead>주문 번호</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>주문 내역</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>결제</TableHead>
                <TableHead>배달</TableHead>
                <TableHead>시간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors align-top">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-gray-500">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-gray-400">{sourceLabel[order.source || ''] || order.source || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={order.type === 'DELIVERY' ? 'info' : 'outline'}>
                      {orderTypeLabel[order.type || ''] || order.type || '-'}
                    </Badge>
                    {order.type === 'TABLE' && (
                      <p className="mt-2 text-sm font-bold">{order.tableNumber ?? '-'}번 테이블</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm text-gray-800">
                      {order.items.map((item) => (
                        <div key={item.id}>
                          {item.menuName} x {item.quantity}
                        </div>
                      ))}
                    </div>
                    {order.delivery && (
                      <p className="mt-2 max-w-xs truncate text-xs text-gray-500">
                        {order.delivery.address}
                        {order.delivery.detailAddress ? ` ${order.delivery.detailAddress}` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount || order.totalPrice)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getPaymentBadgeVariant(order.paymentStatus)}>
                      {paymentStatusLabel[order.paymentStatus || ''] || order.paymentStatus || '-'}
                    </Badge>
                    {order.payments?.[0]?.receiptUrl && (
                      <a
                        href={order.payments[0].receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-xs text-blue-600 underline"
                      >
                        영수증 보기
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {order.delivery ? (
                      <div className="space-y-2">
                        <Badge variant={getDeliveryBadgeVariant(order.delivery.status)}>
                          {deliveryStatusLabel[order.delivery.status]}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          <p>{order.delivery.recipientName}</p>
                          <p>{order.delivery.recipientPhone}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getOrderBadgeVariant(order.status)} className="gap-1">
                      {getStatusIcon(order.status)}
                      {ORDER_STATUS_LABEL[order.status] || order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex min-w-[220px] flex-wrap gap-2">
                      {renderOrderAction(order, updateStatusMutation.mutate)}
                      {renderDeliveryAction(order, updateDeliveryStatusMutation.mutate)}
                      {renderPaymentCancelAction(order, cancelPaymentMutation.mutate)}
                      <button
                        onClick={() => setPrintOrder(order)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <Printer size={14} />
                        출력
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    현재 주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">주문 영수증</h3>
              <button
                onClick={() => setPrintOrder(null)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                aria-label="닫기"
              >
                닫기
              </button>
            </div>
            <OrderReceipt order={printOrder} />
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}건</p>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-6 py-4 text-sm font-semibold text-gray-600">{children}</th>;
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'PAID':
      return <Clock className="w-4 h-4" />;
    case 'CONFIRMED':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'COOKING':
    case 'PREPARING':
      return <ChefHat className="w-4 h-4" />;
    case 'READY':
    case 'DELIVERING':
      return <Truck className="w-4 h-4" />;
    case 'COMPLETED':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'CANCELLED':
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return null;
  }
}

function getOrderBadgeVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'PAID':
      return 'warning';
    case 'CONFIRMED':
      return 'info';
    case 'COOKING':
    case 'PREPARING':
      return 'orange';
    case 'READY':
    case 'DELIVERING':
      return 'info';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'default';
  }
}

function getPaymentBadgeVariant(status?: string): BadgeVariant {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'READY':
    case 'PENDING':
      return 'warning';
    case 'FAILED':
    case 'CANCELLED':
    case 'REFUNDED':
      return 'destructive';
    case 'PARTIAL_REFUNDED':
      return 'orange';
    default:
      return 'outline';
  }
}

function getDeliveryBadgeVariant(status: DeliveryStatus): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'ASSIGNED':
    case 'PICKED_UP':
    case 'DELIVERING':
      return 'info';
    case 'DELIVERED':
      return 'success';
    case 'FAILED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function renderOrderAction(
  order: Order,
  updateStatus: (payload: { orderId: string; status: OrderStatus }) => void
) {
  const next = getNextOrderStatus(order);
  if (!next) return null;

  return (
    <button
      onClick={() => updateStatus({ orderId: order.id, status: next.status })}
      className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-white ${next.className}`}
    >
      {next.icon}
      {next.label}
    </button>
  );
}

function getNextOrderStatus(order: Order): {
  status: OrderStatus;
  label: string;
  className: string;
  icon: React.ReactNode;
} | null {
  if (order.status === 'PENDING' || order.status === 'PAID') {
    return {
      status: 'CONFIRMED',
      label: '접수',
      className: 'bg-blue-600 hover:bg-blue-700',
      icon: <CheckCircle2 size={14} />,
    };
  }
  if (order.status === 'CONFIRMED') {
    return {
      status: 'COOKING',
      label: '조리 시작',
      className: 'bg-orange-500 hover:bg-orange-600',
      icon: <ChefHat size={14} />,
    };
  }
  if (order.status === 'COOKING' || order.status === 'PREPARING') {
    return {
      status: order.type === 'DELIVERY' ? 'READY' : 'COMPLETED',
      label: order.type === 'DELIVERY' ? '배달 준비' : '완료',
      className: 'bg-green-600 hover:bg-green-700',
      icon: <PackageCheck size={14} />,
    };
  }
  return null;
}

function renderDeliveryAction(
  order: Order,
  updateDeliveryStatus: (payload: {
    orderId: string;
    status: DeliveryStatus;
    riderMemo?: string;
  }) => void
) {
  if (order.type !== 'DELIVERY' || !order.delivery || order.status === 'CANCELLED') {
    return null;
  }

  const currentStatus = order.delivery.status;
  const action = deliveryStatusAction[currentStatus];
  if (!action) return null;

  const disabled = order.status !== 'READY' && order.status !== 'DELIVERING';
  return (
    <button
      onClick={() => updateDeliveryStatus({
        orderId: order.id,
        status: action.next,
        riderMemo: action.next === 'ASSIGNED' ? '관리자 화면에서 라이더 배정 처리' : undefined,
      })}
      disabled={disabled}
      title={disabled ? '주문을 배달 준비 상태로 변경한 뒤 사용할 수 있습니다.' : undefined}
      className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:bg-gray-300 ${action.className}`}
    >
      <MapPin size={14} />
      {action.label}
    </button>
  );
}

function renderPaymentCancelAction(
  order: Order,
  cancelPayment: (payload: {
    orderId: string;
    cancelReason: string;
    cancelAmount?: number;
  }) => void
) {
  if (!['PAID', 'PARTIAL_REFUNDED'].includes(order.paymentStatus || '')) {
    return null;
  }

  const payment = order.payments?.find((candidate) => ['PAID', 'PARTIAL_REFUNDED'].includes(candidate.status));
  if (!payment) return null;

  const paidAmount = payment.approvedAmount || payment.amount;
  const cancelledAmount = payment.cancelledAmount || 0;
  const remainingAmount = paidAmount - cancelledAmount;
  if (remainingAmount <= 0) return null;

  const handleFullCancel = () => {
    const reason = window.prompt('전액 취소/환불 사유를 입력해주세요.', '고객 요청으로 주문을 취소합니다.');
    if (!reason) return;

    cancelPayment({
      orderId: order.id,
      cancelReason: reason,
    });
  };

  const handlePartialCancel = () => {
    const amountText = window.prompt(`부분 환불 금액을 입력해주세요. 남은 결제금액: ${remainingAmount.toLocaleString()}원`);
    if (!amountText) return;

    const cancelAmount = Number(amountText.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(cancelAmount) || cancelAmount <= 0 || cancelAmount > remainingAmount) {
      window.alert('환불 금액을 다시 확인해주세요.');
      return;
    }

    const reason = window.prompt('부분 환불 사유를 입력해주세요.', '관리자 부분 환불 처리');
    if (!reason) return;

    cancelPayment({
      orderId: order.id,
      cancelReason: reason,
      cancelAmount,
    });
  };

  return (
    <>
      <button
        onClick={handleFullCancel}
        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
      >
        <XCircle size={14} />
        전액 취소
      </button>
      <button
        onClick={handlePartialCancel}
        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
      >
        부분 환불
      </button>
    </>
  );
}
