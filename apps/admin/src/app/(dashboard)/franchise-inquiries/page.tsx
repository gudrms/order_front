'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, Clock, MessageSquareText, RefreshCw } from 'lucide-react';
import { Badge } from '@order/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getHttpErrorMessage } from '@/lib/httpError';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FranchiseInquiryStatus = 'NEW' | 'CONTACTED' | 'CLOSED';

type FranchiseInquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  message?: string | null;
  status: FranchiseInquiryStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusLabels: Record<FranchiseInquiryStatus, string> = {
  NEW: '신규',
  CONTACTED: '연락 완료',
  CLOSED: '종료',
};

const statusOptions: FranchiseInquiryStatus[] = ['NEW', 'CONTACTED', 'CLOSED'];

export default function FranchiseInquiriesPage() {
  const { session, profile } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'ALL' | FranchiseInquiryStatus>('ALL');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const authHeaders = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined;

  const inquiriesQuery = useQuery<FranchiseInquiry[]>({
    queryKey: ['franchise-inquiries', statusFilter],
    queryFn: async () => {
      const query = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const response = await axios.get(`${API_URL}/franchise-inquiries${query}`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!session && profile?.role === 'ADMIN',
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      inquiryId,
      status,
      adminNote,
    }: {
      inquiryId: string;
      status?: FranchiseInquiryStatus;
      adminNote?: string;
    }) => {
      const response = await axios.patch(
        `${API_URL}/franchise-inquiries/${inquiryId}`,
        { status, adminNote },
        { headers: authHeaders }
      );
      return response.data.data || response.data;
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: '가맹 문의가 업데이트되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['franchise-inquiries'] });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message: getHttpErrorMessage(error, '가맹 문의 업데이트에 실패했습니다.'),
      });
    },
  });

  const inquiries = inquiriesQuery.data || [];
  const summary = useMemo(() => {
    return inquiries.reduce(
      (acc, inquiry) => {
        acc[inquiry.status] += 1;
        return acc;
      },
      { NEW: 0, CONTACTED: 0, CLOSED: 0 } as Record<FranchiseInquiryStatus, number>
    );
  }, [inquiries]);

  if (profile && profile.role !== 'ADMIN') {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-gray-800">접근 권한이 없습니다</h2>
        <p className="mt-2 text-sm text-gray-500">가맹 문의는 플랫폼 관리자만 조회할 수 있습니다.</p>
      </div>
    );
  }

  if (inquiriesQuery.isLoading) {
    return <div className="py-12 text-center text-gray-500">가맹 문의를 불러오는 중입니다.</div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-franchise-inquiries-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">가맹 문의</h2>
          <p className="text-sm text-gray-500">브랜드 사이트에서 접수된 창업 상담 요청을 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => inquiriesQuery.refetch()}
          disabled={inquiriesQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={inquiriesQuery.isFetching ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-semibold opacity-70 hover:opacity-100"
          >
            닫기
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<Clock size={20} />} label="신규" value={summary.NEW} tone="blue" />
        <SummaryCard icon={<MessageSquareText size={20} />} label="연락 완료" value={summary.CONTACTED} tone="green" />
        <SummaryCard icon={<CheckCircle2 size={20} />} label="종료" value={summary.CLOSED} tone="gray" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', ...statusOptions] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-slate-900 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'ALL' ? '전체' : statusLabels[status]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead>문의자</TableHead>
                <TableHead>희망 지역</TableHead>
                <TableHead>문의 내용</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리 메모</TableHead>
                <TableHead>접수일</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inquiries.map((inquiry) => {
                const noteValue = noteDrafts[inquiry.id] ?? inquiry.adminNote ?? '';

                return (
                  <tr key={inquiry.id} className="align-top hover:bg-gray-50/60">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{inquiry.name}</p>
                      <p className="mt-1 text-sm text-gray-600">{inquiry.phone}</p>
                      <p className="mt-1 text-sm text-gray-500">{inquiry.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">{inquiry.area}</td>
                    <td className="px-5 py-4">
                      <p className="max-w-md whitespace-pre-wrap break-words text-sm text-gray-700">
                        {inquiry.message || '-'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={inquiry.status} />
                      <select
                        value={inquiry.status}
                        onChange={(event) =>
                          updateMutation.mutate({
                            inquiryId: inquiry.id,
                            status: event.target.value as FranchiseInquiryStatus,
                            adminNote: noteValue,
                          })
                        }
                        className="mt-3 block w-32 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <textarea
                        value={noteValue}
                        onChange={(event) =>
                          setNoteDrafts((prev) => ({ ...prev, [inquiry.id]: event.target.value }))
                        }
                        className="h-24 w-64 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                        placeholder="상담 이력 또는 후속 조치"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({
                            inquiryId: inquiry.id,
                            status: inquiry.status,
                            adminNote: noteValue,
                          })
                        }
                        disabled={updateMutation.isPending}
                        className="mt-2 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        메모 저장
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                );
              })}
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    조회된 가맹 문의가 없습니다.
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

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'blue' | 'green' | 'gray';
}) {
  const toneClass = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    gray: 'text-gray-600 bg-gray-50',
  }[tone];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-lg p-2 ${toneClass}`}>{icon}</div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}건</p>
    </div>
  );
}

function StatusBadge({ status }: { status: FranchiseInquiryStatus }) {
  if (status === 'NEW') return <Badge variant="default">신규</Badge>;
  if (status === 'CONTACTED') return <Badge variant="outline">연락 완료</Badge>;
  return <Badge variant="secondary">종료</Badge>;
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-sm font-semibold text-gray-600">{children}</th>;
}
