'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CheckCircle2,
  ChefHat,
  ChevronDown,
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
import { getHttpErrorMessage } from '@/lib/httpError';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];
type RefundMode = 'full' | 'partial';
type RefundDialogState = {
  order: Order;
  mode: RefundMode;
  remainingAmount: number;
};
type OperationMessage = {
  type: 'success' | 'error';
  message: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const orderTypeLabel: Record<string, string> = {
  TABLE: '테이블',
  DELIVERY: '배달',
  TAKEOUT: '포장',
};

const sourceLabel: Record<string, string> = {
  TABLE_ORDER: '테이블오더',
  DELIVERY_APP: '배달앱',
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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [refundDialog, setRefundDialog] = useState<RefundDialogState | null>(null);
  const [operationMessage, setOperationMessage] = useState<OperationMessage | null>(null);
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
      setRefundDialog(null);
      setOperationMessage({ type: 'success', message: '주문 상태를 변경했습니다.' });
      queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
    },
    onError: (error) => {
      setOperationMessage({
        type: 'error',
        message: getHttpErrorMessage(error, '주문 상태 변경에 실패했습니다.'),
      });
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
      setOperationMessage({ type: 'success', message: '배달 상태를 변경했습니다.' });
      queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
    },
    onError: (error) => {
      setOperationMessage({
        type: 'error',
        message: getHttpErrorMessage(error, '배달 상태 변경에 실패했습니다.'),
      });
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
      setRefundDialog(null);
      setOperationMessage({ type: 'success', message: '취소/환불 처리가 완료되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
    },
    onError: (error) => {
      setOperationMessage({
        type: 'error',
        message: getHttpErrorMessage(error, '취소/환불 처리에 실패했습니다.'),
      });
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
          마스터 관리자에게 계정과 매장 연결을 요청해주세요.
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

      {operationMessage && (
        <OperationAlert
          type={operationMessage.type}
          message={operationMessage.message}
          onClose={() => setOperationMessage(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="접수 대기" value={orders.filter((order) => ['PENDING', 'PAID'].includes(order.status)).length} />
        <SummaryCard label="조리/준비" value={orders.filter((order) => ['CONFIRMED', 'COOKING', 'PREPARING', 'READY'].includes(order.status)).length} />
        <SummaryCard label="배달 중" value={orders.filter((order) => order.delivery?.status === 'DELIVERING').length} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-testid="admin-orders-table">
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
                <React.Fragment key={order.id}>
                <tr className="hover:bg-gray-50/50 transition-colors align-top" data-testid={`admin-order-row-${order.id}`}>
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
                      <button
                        onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        data-testid={`admin-order-detail-toggle-${order.id}`}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`}
                        />
                        상세
                      </button>
                      {renderOrderAction(order, updateStatusMutation.mutate)}
                      {renderDeliveryAction(order, updateDeliveryStatusMutation.mutate)}
                      {renderPaymentCancelAction(order, setRefundDialog)}
                      <button
                        onClick={() => setPrintOrder(order)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        data-testid={`admin-order-print-${order.id}`}
                      >
                        <Printer size={14} />
                        출력
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr className="bg-slate-50/80">
                    <td colSpan={9} className="px-6 py-5">
                      <OrderDetailPanel order={order} />
                    </td>
                  </tr>
                )}
                </React.Fragment>
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
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-white p-4 shadow-xl" data-testid="admin-order-receipt-modal">
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

      {refundDialog && (
        <RefundDialog
          key={`${refundDialog.order.id}-${refundDialog.mode}`}
          dialog={refundDialog}
          isSubmitting={cancelPaymentMutation.isPending}
          onClose={() => setRefundDialog(null)}
          onSubmit={({ cancelReason, cancelAmount }) => {
            cancelPaymentMutation.mutate({
              orderId: refundDialog.order.id,
              cancelReason,
              cancelAmount,
            });
          }}
        />
      )}
    </div>
  );
}

function OrderDetailPanel({ order }: { order: Order }) {
  const delivery = order.delivery;
  const payments = order.payments || [];
  const refundHistory = getRefundHistory(order);

  return (
    <div className="grid gap-4 text-sm text-gray-700 lg:grid-cols-[1fr_1fr_1.2fr]">
      <DetailSection title="주문 정보">
        <DetailItem label="주문 번호" value={order.orderNumber} />
        <DetailItem label="주문 경로" value={sourceLabel[order.source || ''] || order.source || '-'} />
        <DetailItem label="주문 유형" value={orderTypeLabel[order.type || ''] || order.type || '-'} />
        <DetailItem label="테이블" value={order.tableNumber ? `${order.tableNumber}번` : '-'} />
        <DetailItem label="Toss 주문 ID" value={order.tossOrderId || '-'} />
        <DetailItem label="요청 사항" value={order.note || '-'} />
        <DetailItem label="주문 생성" value={formatOptionalDate(order.createdAt)} />
        <DetailItem label="최근 변경" value={formatOptionalDate(order.updatedAt)} />
        <DetailItem label="완료 시각" value={formatOptionalDate(order.completedAt)} />
        <DetailItem label="취소 시각" value={formatOptionalDate(order.cancelledAt)} />
        <DetailItem label="취소 사유" value={order.cancelReason || '-'} />
      </DetailSection>

      <DetailSection title="배달 정보">
        {delivery ? (
          <>
            <DetailItem label="수령인" value={delivery.recipientName} />
            <DetailItem label="연락처" value={delivery.recipientPhone} />
            <DetailItem
              label="주소"
              value={`${delivery.address}${delivery.detailAddress ? ` ${delivery.detailAddress}` : ''}`}
            />
            <DetailItem label="우편번호" value={delivery.zipCode || '-'} />
            <DetailItem label="배달비" value={formatCurrency(delivery.deliveryFee || 0)} />
            <DetailItem label="배달 상태" value={deliveryStatusLabel[delivery.status] || delivery.status} />
            <DetailItem label="예상 시간" value={delivery.estimatedMinutes ? `${delivery.estimatedMinutes}분` : '-'} />
            <DetailItem label="배달 메모" value={delivery.deliveryMemo || '-'} />
            <DetailItem label="라이더 메모" value={delivery.riderMemo || '-'} />
            <DetailItem label="요청 시각" value={formatOptionalDate(delivery.requestedAt)} />
            <DetailItem label="배정 시각" value={formatOptionalDate(delivery.assignedAt)} />
            <DetailItem label="픽업 시각" value={formatOptionalDate(delivery.pickedUpAt)} />
            <DetailItem label="완료 시각" value={formatOptionalDate(delivery.deliveredAt)} />
            <DetailItem label="취소 시각" value={formatOptionalDate(delivery.cancelledAt)} />
          </>
        ) : (
          <p className="text-gray-400">배달 정보가 없는 주문입니다.</p>
        )}
      </DetailSection>

      <div className="space-y-4">
        <DetailSection title="결제 정보">
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">{payment.provider || '-'}</span>
                    <Badge variant={getPaymentBadgeVariant(payment.status)}>
                      {paymentStatusLabel[payment.status || ''] || payment.status || '-'}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <DetailItem label="수단" value={payment.method || '-'} />
                    <DetailItem label="결제키" value={payment.paymentKey || '-'} />
                    <DetailItem label="Toss 주문 ID" value={payment.providerOrderId || '-'} />
                    <DetailItem label="요청 금액" value={formatCurrency(payment.amount || 0)} />
                    <DetailItem label="승인 금액" value={formatCurrency(payment.approvedAmount || 0)} />
                    <DetailItem label="취소 금액" value={formatCurrency(payment.cancelledAmount || 0)} />
                    <DetailItem label="승인 시각" value={formatOptionalDate(payment.approvedAt)} />
                    <DetailItem label="취소 시각" value={formatOptionalDate(payment.cancelledAt)} />
                    <DetailItem label="실패 코드" value={payment.failureCode || '-'} />
                    <DetailItem label="실패 메시지" value={payment.failureMessage || '-'} />
                    <DetailItem
                      label="영수증"
                      value={payment.receiptUrl ? (
                        <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          보기
                        </a>
                      ) : '-'}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">결제 정보가 없습니다.</p>
          )}
        </DetailSection>

        <DetailSection title="취소/환불 이력">
          {refundHistory.length > 0 ? (
            <div className="space-y-3">
              {refundHistory.map((history) => (
                <div key={history.id} className="rounded-lg border border-red-100 bg-red-50/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-red-900">
                      {history.kind === 'full' ? '전액 취소' : '부분 환불'}
                    </span>
                    <span className="text-sm font-semibold text-red-700">
                      {formatCurrency(history.amount)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <DetailItem label="상태" value={history.status || '-'} />
                    <DetailItem label="처리 시각" value={formatOptionalDate(history.cancelledAt)} />
                    <DetailItem label="사유" value={history.reason || '-'} />
                    <DetailItem label="거래키" value={history.transactionKey || '-'} />
                    <DetailItem label="영수증키" value={history.receiptKey || '-'} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">취소/환불 이력이 없습니다.</p>
          )}
        </DetailSection>

        <DetailSection title="주문 항목">
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.menuName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                </div>
                {item.options && item.options.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    {item.options.map((option) => (
                      <div key={option.optionGroupId}>
                        <span className="font-medium text-gray-600">{option.optionGroupName}: </span>
                        {option.items.map((optionItem) => `${optionItem.name} (+${optionItem.price.toLocaleString()}원)`).join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DetailSection>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3">
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-sm text-gray-700">{value || '-'}</span>
    </div>
  );
}

function formatOptionalDate(value?: Date | string | null) {
  return value ? formatDate(value) : '-';
}

type RefundHistoryItem = {
  id: string;
  kind: 'full' | 'partial';
  amount: number;
  status?: string;
  reason?: string;
  cancelledAt?: Date | string | null;
  transactionKey?: string;
  receiptKey?: string;
};

function getRefundHistory(order: Order): RefundHistoryItem[] {
  return (order.payments || []).flatMap((payment): RefundHistoryItem[] => {
    const paidAmount = payment.approvedAmount || payment.amount || 0;
    const tossCancels = getTossCancels(payment);

    if (tossCancels.length > 0) {
      return tossCancels.map((cancel, index) => {
        const amount = toNumber(cancel.cancelAmount);
        const status = toText(cancel.cancelStatus);
        return {
          id: `${payment.id}-${toText(cancel.transactionKey) || index}`,
          kind: amount >= paidAmount ? 'full' : 'partial',
          amount,
          status,
          reason: toText(cancel.cancelReason),
          cancelledAt: toText(cancel.canceledAt) || toText(cancel.cancelledAt),
          transactionKey: toText(cancel.transactionKey),
          receiptKey: toText(cancel.receiptKey),
        };
      });
    }

    const cancelledAmount = payment.cancelledAmount || 0;
    if (cancelledAmount <= 0) return [];

    return [{
      id: `${payment.id}-fallback`,
      kind: cancelledAmount >= paidAmount ? 'full' : 'partial',
      amount: cancelledAmount,
      status: payment.status,
      reason: order.cancelReason || undefined,
      cancelledAt: payment.cancelledAt,
    }];
  });
}

function getTossCancels(payment: { rawPayload?: unknown }): Record<string, unknown>[] {
  const rawPayload = asRecord(payment.rawPayload);
  const cancels = rawPayload?.cancels;
  return Array.isArray(cancels) ? cancels.flatMap((item) => {
    const record = asRecord(item);
    return record ? [record] : [];
  }) : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function RefundDialog({
  dialog,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  dialog: RefundDialogState;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { cancelReason: string; cancelAmount?: number }) => void;
}) {
  const isPartial = dialog.mode === 'partial';
  const [amountText, setAmountText] = useState(isPartial ? '' : String(dialog.remainingAmount));
  const [reason, setReason] = useState(isPartial ? '관리자 부분 환불 처리' : '고객 요청으로 주문을 취소합니다.');
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = Number(amountText.replace(/[^0-9]/g, ''));

  const handleSubmit = () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('취소/환불 사유를 입력해주세요.');
      return;
    }

    if (isPartial) {
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > dialog.remainingAmount) {
        setError('환불 금액은 남은 결제금액 이하로 입력해주세요.');
        return;
      }

      onSubmit({ cancelReason: trimmedReason, cancelAmount: parsedAmount });
      return;
    }

    onSubmit({ cancelReason: trimmedReason });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isPartial ? '부분 환불' : '전액 취소'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {dialog.order.orderNumber} · 환불 가능 {formatCurrency(dialog.remainingAmount)}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="닫기"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {isPartial && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">환불 금액</span>
              <div className="mt-2 flex items-center rounded-lg border border-gray-200 px-3 focus-within:border-gray-900">
                <input
                  value={amountText}
                  onChange={(event) => {
                    setAmountText(event.target.value);
                    setError(null);
                  }}
                  inputMode="numeric"
                  placeholder="환불할 금액"
                  className="h-11 min-w-0 flex-1 border-0 text-sm outline-none"
                />
                <span className="text-sm text-gray-400">원</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                최대 {formatCurrency(dialog.remainingAmount)}까지 환불할 수 있습니다.
              </p>
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-gray-700">사유</span>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
              placeholder="취소/환불 사유"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            data-testid={`admin-refund-submit-${dialog.mode}`}
          >
            {isSubmitting ? '처리 중...' : isPartial ? '부분 환불' : '전액 취소'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OperationAlert({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) {
  const isSuccess = type === 'success';

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        isSuccess
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
      data-testid="admin-order-operation-message"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded px-2 py-1 text-xs font-semibold opacity-70 hover:bg-white/60 hover:opacity-100"
      >
        닫기
      </button>
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
      data-testid={`admin-order-status-action-${order.id}`}
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
      data-testid={`admin-delivery-status-action-${order.id}`}
    >
      <MapPin size={14} />
      {action.label}
    </button>
  );
}

function renderPaymentCancelAction(
  order: Order,
  openRefundDialog: (dialog: RefundDialogState) => void
) {
  if (!['PAID', 'PARTIAL_REFUNDED'].includes(order.paymentStatus || '')) {
    return null;
  }

  const remainingAmount = getRefundableAmount(order);
  if (remainingAmount <= 0) return null;

  return (
    <>
      <button
        onClick={() => openRefundDialog({ order, mode: 'full', remainingAmount })}
        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
        data-testid={`admin-refund-full-${order.id}`}
      >
        <XCircle size={14} />
        전액 취소
      </button>
      <button
        onClick={() => openRefundDialog({ order, mode: 'partial', remainingAmount })}
        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        data-testid={`admin-refund-partial-${order.id}`}
      >
        부분 환불
      </button>
    </>
  );
}

function getRefundableAmount(order: Order) {
  const payment = order.payments?.find((candidate) => ['PAID', 'PARTIAL_REFUNDED'].includes(candidate.status));
  if (!payment) return 0;

  const paidAmount = payment.approvedAmount || payment.amount;
  const cancelledAmount = payment.cancelledAmount || 0;
  return paidAmount - cancelledAmount;
}
