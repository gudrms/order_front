'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, MapPin, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Move to shared types
interface Address {
    id: string;
    name: string;
    address: string;
    detailAddress?: string;
    zipCode?: string;
    isDefault: boolean;
}

export default function AddressListPage() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // TODO: Replace with actual API call
    const fetchAddresses = async (): Promise<Address[]> => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses`);
        if (!res.ok) throw new Error('Failed to fetch addresses');
        return res.json();
    };

    const { data: addresses, isLoading } = useQuery({
        queryKey: ['addresses'],
        queryFn: fetchAddresses,
        enabled: !!user,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete address');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-4 h-14 flex items-center border-b border-gray-100 sticky top-0 z-50">
                <button onClick={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg ml-2">주소 관리</h1>
                <button
                    onClick={() => router.push('/mypage/address/new')}
                    className="ml-auto text-sm font-medium text-brand-yellow"
                >
                    <Plus size={24} />
                </button>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-3">
                {addresses?.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                        <p>등록된 주소가 없습니다.</p>
                        <button
                            onClick={() => router.push('/mypage/address/new')}
                            className="mt-4 px-6 py-2 bg-brand-yellow text-white rounded-xl font-bold"
                        >
                            새 주소 추가하기
                        </button>
                    </div>
                ) : (
                    addresses?.map((addr) => (
                        <div key={addr.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{addr.name}</span>
                                    {addr.isDefault && (
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                                            기본 배달지
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('정말 삭제하시겠습니까?')) {
                                            deleteMutation.mutate(addr.id);
                                        }
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <p className="text-gray-600 text-sm mb-1">{addr.address}</p>
                            <p className="text-gray-500 text-sm">{addr.detailAddress}</p>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
