'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import type { UserAddress } from '@order/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from '@/hooks/queries/useAddresses';

function applyAddressToDelivery(address: UserAddress) {
    return {
        id: address.id,
        name: address.name,
        address: address.address,
        detailAddress: address.detailAddress || undefined,
        zipCode: address.zipCode || undefined,
        latitude: typeof address.latitude === 'number' ? address.latitude : undefined,
        longitude: typeof address.longitude === 'number' ? address.longitude : undefined,
    };
}

export default function AddressListPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { setAddress, setCustomerInfo, setDeliveryRequest } = useDeliveryStore();
    const { data: addresses = [], isLoading } = useAddresses(user?.id);
    const deleteMutation = useDeleteAddress(user?.id);
    const setDefaultMutation = useSetDefaultAddress(user?.id);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, router, user]);

    const handleUseAddress = (address: UserAddress) => {
        setAddress(applyAddressToDelivery(address));
        if (address.recipientName || address.recipientPhone) {
            setCustomerInfo(address.recipientName || '', address.recipientPhone || '');
        }
        setDeliveryRequest(address.deliveryMemo || '');
        router.push('/menu');
    };

    const handleDelete = (address: UserAddress) => {
        if (!confirm(`'${address.name}' 주소를 삭제할까요?`)) return;
        deleteMutation.mutate(address.id);
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-4 h-14 flex items-center border-b border-gray-100 sticky top-0 z-50">
                <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="이전 페이지">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg ml-2">주소 관리</h1>
                <button
                    onClick={() => router.push('/mypage/address/new')}
                    className="ml-auto text-sm font-medium text-brand-yellow"
                    aria-label="새 주소 추가"
                >
                    <Plus size={24} />
                </button>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-3">
                {addresses.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                        <p>등록된 주소가 없습니다.</p>
                        <button
                            onClick={() => router.push('/mypage/address/new')}
                            className="mt-4 px-6 py-2 bg-brand-yellow text-brand-black rounded-xl font-bold"
                        >
                            새 주소 추가하기
                        </button>
                    </div>
                ) : (
                    addresses.map((address) => (
                        <article
                            key={address.id}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-900">{address.name}</span>
                                        {address.isDefault && (
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                                                기본 배달지
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 text-sm mt-2">{address.address}</p>
                                    {address.detailAddress && (
                                        <p className="text-gray-500 text-sm">{address.detailAddress}</p>
                                    )}
                                    {(address.recipientName || address.recipientPhone) && (
                                        <p className="text-gray-400 text-xs mt-2">
                                            {address.recipientName || '-'} · {address.recipientPhone || '-'}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(address)}
                                    disabled={deleteMutation.isPending}
                                    className="text-gray-400 hover:text-red-500 p-1 disabled:opacity-50"
                                    aria-label="주소 삭제"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setDefaultMutation.mutate(address.id)}
                                    disabled={address.isDefault || setDefaultMutation.isPending}
                                    className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                    <Check size={16} />
                                    기본 설정
                                </button>
                                <button
                                    onClick={() => handleUseAddress(address)}
                                    className="rounded-lg bg-brand-black py-2 text-sm font-bold text-white"
                                >
                                    이 주소로 주문
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </main>
    );
}
