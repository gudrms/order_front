'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, Bell, RefreshCw, Send } from 'lucide-react';
import { formatCurrency, formatDate, type Order } from '@order/shared';
import { Badge } from '@order/ui';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { getHttpErrorMessage } from '@/lib/httpError';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type PosFailureOrder = Order & {
  posSyncStatus?: string;
  posSyncAttemptCount?: number;
  posSyncLastError?: string | null;
  posSyncUpdatedAt?: Date | string | null;
};

type NotificationFailure = {
  id: string;
  recipientType: string;
  recipientId?: string | null;
  notificationType: string;
  orderId?: string | null;
  storeId?: string | null;
  channel: string;
  dedupeKey: string;
  status: string;
  payload?: unknown;
  lastError?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type OperationMessage = {
  type: 'success' | 'error';
  message: string;
};

export default function OperationsPage() {
  const { session } = useAuth();
  const { selectedStore, selectedStoreId: storeId, isLoading: isStoresLoading, authHeaders } = useAdminStore();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<OperationMessage | null>(null);

  const posFailuresQuery = useQuery<PosFailureOrder[]>({
    queryKey: ['admin-pos-sync-failures', storeId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/stores/${storeId}/orders/pos-sync/failed`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!session && !!storeId,
  });

  const notificationFailuresQuery = useQuery<NotificationFailure[]>({
    queryKey: ['admin-notification-failures', storeId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/stores/${storeId}/operations/notifications/failed`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!session && !!storeId,
  });

  const retryPosMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await axios.patch(
        `${API_URL}/stores/${storeId}/orders/${orderId}/pos-sync/retry`,
        undefined,
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      setMessage({ type: 'success', message: 'POS 전송 재시도를 등록했습니다.' });
      queryClient.invalidateQueries({ queryKey: ['admin-pos-sync-failures', storeId] });
    },
    onError: (error) => {
      setMessage({
        type: 'error',
        message: getHttpErrorMessage(error, 'POS 전송 재시도 등록에 실패했습니다.'),
      });
    },
  });

  const retryNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.patch(
        `${API_URL}/stores/${storeId}/operations/notifications/${notificationId}/retry`,
        undefined,
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      setMessage({ type: 'success', message: '알림 발송 재시도를 등록했습니다.' });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-failures', storeId] });
    },
    onError: (error) => {
      setMessage({
        type: 'error',
        message: getHttpErrorMessage(error, '알림 발송 재시도 등록에 실패했습니다.'),
      });
    },
  });

  const posFailures = posFailuresQuery.data || [];
  const notificationFailures = notificationFailuresQuery.data || [];
  const isLoading = isStoresLoading || posFailuresQuery.isLoading || notificationFailuresQuery.isLoading;
  const isRefreshing = posFailuresQuery.isFetching || notificationFailuresQuery.isFetching;

  const totalFailures = posFailures.length + notificationFailures.length;
  const latestFailureAt = useMemo(() => {
    const dates = [
      ...posFailures.map((item) => item.posSyncUpdatedAt || item.updatedAt || item.createdAt),
      ...notificationFailures.map((item) => item.updatedAt),
    ].filter(Boolean);
    return dates.length > 0 ? dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] : null;
  }, [posFailures, notificationFailures]);

  const refreshAll = () => {
    posFailuresQuery.refetch();
    notificationFailuresQuery.refetch();
  };

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">운영 상태를 불러오는 중입니다.</div>;
  }

  if (!storeId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-gray-800">연결된 매장이 없습니다</h2>
        <p className="mt-2 text-sm text-gray-500">운영 상태를 확인하려면 먼저 매장을 연결해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-operations-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">운영 관리</h2>
          <p className="text-sm text-gray-500">
            {selectedStore?.name} {selectedStore?.branchName ? `· ${selectedStore.branchName}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {message && (
        <OperationAlert
          type={message.type}
          message={message.message}
          onClose={() => setMessage(null)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryPanel label="전체 실패" value={`${totalFailures}건`} tone={totalFailures > 0 ? 'danger' : 'default'} />
        <SummaryPanel label="POS 전송 실패" value={`${posFailures.length}건`} tone={posFailures.length > 0 ? 'danger' : 'default'} />
        <SummaryPanel label="알림 발송 실패" value={`${notificationFailures.length}건`} tone={notificationFailures.length > 0 ? 'danger' : 'default'} detail={latestFailureAt ? `최근 ${formatDate(latestFailureAt)}` : '최근 실패 없음'} />
      </div>

      <section className="space-y-3">
        <SectionTitle
          icon={<Send size={18} />}
          title="POS 전송 실패"
          count={posFailures.length}
        />
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <TableHead>주문</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>시도</TableHead>
                  <TableHead>마지막 오류</TableHead>
                  <TableHead>업데이트</TableHead>
                  <TableHead>관리</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posFailures.map((order) => (
                  <tr key={order.id} className="align-top hover:bg-gray-50/60" data-testid={`admin-pos-failure-${order.id}`}>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-gray-500">{order.orderNumber}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="destructive">{order.posSyncStatus || 'FAILED'}</Badge>
                        <Badge variant="outline">{order.source || '-'}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount || order.totalPrice || 0)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {order.posSyncAttemptCount ?? 0}회
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-lg whitespace-pre-wrap break-words text-sm text-gray-700">
                        {order.posSyncLastError || '오류 메시지가 없습니다.'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatOptionalDate(order.posSyncUpdatedAt || order.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <RetryButton
                        label="POS 재시도"
                        disabled={retryPosMutation.isPending}
                        onClick={() => retryPosMutation.mutate(order.id)}
                        testId={`admin-pos-retry-${order.id}`}
                      />
                    </td>
                  </tr>
                ))}
                {posFailures.length === 0 && (
                  <EmptyRow colSpan={6} message="POS 전송 실패가 없습니다." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle
          icon={<Bell size={18} />}
          title="알림 발송 실패"
          count={notificationFailures.length}
        />
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <TableHead>알림</TableHead>
                  <TableHead>수신 대상</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead>마지막 오류</TableHead>
                  <TableHead>업데이트</TableHead>
                  <TableHead>관리</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {notificationFailures.map((notification) => (
                  <tr key={notification.id} className="align-top hover:bg-gray-50/60" data-testid={`admin-notification-failure-${notification.id}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{notificationTypeLabel[notification.notificationType] || notification.notificationType}</p>
                      <p className="mt-1 max-w-xs truncate font-mono text-xs text-gray-400">{notification.dedupeKey}</p>
                      {notification.orderId && (
                        <p className="mt-1 font-mono text-xs text-gray-500">주문 {notification.orderId}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      <Badge variant="outline">{recipientTypeLabel[notification.recipientType] || notification.recipientType}</Badge>
                      <p className="mt-2 font-mono text-xs text-gray-400">{notification.recipientId || '-'}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{notification.channel}</td>
                    <td className="px-5 py-4">
                      <p className="max-w-lg whitespace-pre-wrap break-words text-sm text-gray-700">
                        {notification.lastError || '오류 메시지가 없습니다.'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatOptionalDate(notification.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <RetryButton
                        label="알림 재시도"
                        disabled={retryNotificationMutation.isPending}
                        onClick={() => retryNotificationMutation.mutate(notification.id)}
                        testId={`admin-notification-retry-${notification.id}`}
                      />
                    </td>
                  </tr>
                ))}
                {notificationFailures.length === 0 && (
                  <EmptyRow colSpan={6} message="알림 발송 실패가 없습니다." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

const notificationTypeLabel: Record<string, string> = {
  ORDER_PAID: '주문 결제 완료',
  ORDER_CONFIRMED: '주문 접수',
  ORDER_CANCELLED: '주문 취소',
  DELIVERY_STATUS_CHANGED: '배달 상태 변경',
  POS_SYNC_FAILED: 'POS 전송 실패',
};

const recipientTypeLabel: Record<string, string> = {
  CUSTOMER: '고객',
  STORE: '매장',
  ADMIN: '관리자',
};

function SummaryPanel({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {tone === 'danger' && <AlertTriangle size={20} className="text-red-500" />}
        <p className={`text-2xl font-bold ${tone === 'danger' ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      </div>
      {detail && <p className="mt-2 text-xs text-gray-400">{detail}</p>}
    </div>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="inline-flex items-center gap-2 text-base font-bold text-gray-800">
        {icon}
        {title}
      </h3>
      <Badge variant={count > 0 ? 'destructive' : 'outline'}>{count}건</Badge>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-sm font-semibold text-gray-600">{children}</th>;
}

function RetryButton({
  label,
  disabled,
  onClick,
  testId,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      data-testid={testId}
    >
      <RefreshCw size={14} className={disabled ? 'animate-spin' : ''} />
      {label}
    </button>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-gray-400">
        {message}
      </td>
    </tr>
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
      data-testid="admin-operations-message"
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

function formatOptionalDate(value?: Date | string | null) {
  return value ? formatDate(value) : '-';
}
