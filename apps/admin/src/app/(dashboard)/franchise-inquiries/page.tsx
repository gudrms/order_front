'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, FileText, Mail, MapPin, MessageSquare, Phone, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface FranchiseInquiry {
    id: string;
    name: string;
    phone: string;
    email: string;
    area: string;
    message?: string | null;
    isRead: boolean;
    createdAt: string;
}

async function fetchInquiries(token: string): Promise<FranchiseInquiry[]> {
    const res = await fetch(`${API_URL}/franchise-inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('문의 목록을 불러오지 못했습니다.');
    return res.json();
}

async function markAsRead(id: string, token: string) {
    const res = await fetch(`${API_URL}/franchise-inquiries/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('처리 실패');
    return res.json();
}

export default function FranchiseInquiriesPage() {
    const { session } = useAuth();
    const queryClient = useQueryClient();
    const token = session?.access_token ?? '';

    const { data: inquiries = [], isLoading, isError } = useQuery({
        queryKey: ['franchise-inquiries'],
        queryFn: () => fetchInquiries(token),
        enabled: !!token,
        refetchInterval: 60_000,
    });

    const readMutation = useMutation({
        mutationFn: (id: string) => markAsRead(id, token),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['franchise-inquiries'] }),
    });

    const unreadCount = inquiries.filter((i) => !i.isRead).length;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">창업 문의 목록</h2>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}건 미확인
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500">전체 {inquiries.length}건</p>
            </div>

            {/* 로딩/에러 */}
            {isLoading && (
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                        </div>
                    ))}
                </div>
            )}
            {isError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-center">
                    문의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </div>
            )}

            {/* 목록 없음 */}
            {!isLoading && !isError && inquiries.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">아직 창업 문의가 없습니다.</p>
                </div>
            )}

            {/* 카드 목록 */}
            {!isLoading && !isError && (
                <div className="grid gap-4">
                    {inquiries.map((inquiry) => (
                        <div
                            key={inquiry.id}
                            className={`bg-white rounded-xl border p-5 transition-all ${
                                inquiry.isRead
                                    ? 'border-gray-200 opacity-80'
                                    : 'border-blue-200 shadow-sm ring-1 ring-blue-100'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* 좌측: 신청자 정보 */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-900 text-lg">{inquiry.name}</span>
                                        {!inquiry.isRead && (
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                NEW
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                                        <p className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            {inquiry.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            {inquiry.email}
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            {inquiry.area}
                                        </p>
                                    </div>

                                    {inquiry.message && (
                                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-1">
                                            <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                                <MessageSquare className="w-3 h-3" />
                                                문의 내용
                                            </p>
                                            <p className="whitespace-pre-wrap">{inquiry.message}</p>
                                        </div>
                                    )}
                                </div>

                                {/* 우측: 읽음 처리 버튼 */}
                                {!inquiry.isRead && (
                                    <button
                                        onClick={() => readMutation.mutate(inquiry.id)}
                                        disabled={readMutation.isPending}
                                        className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 border border-green-200 hover:border-green-300 px-3 py-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        확인 완료
                                    </button>
                                )}
                                {inquiry.isRead && (
                                    <span className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0 pt-0.5">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        확인됨
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
