'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Search } from 'lucide-react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { useAuth } from '@/contexts/AuthContext';

interface CreateAddressDto {
    name: string;
    address: string;
    detailAddress?: string;
    zipCode?: string;
    isDefault: boolean;
}

export default function NewAddressPage() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isOpenPostcode, setIsOpenPostcode] = useState(false);
    const [formData, setFormData] = useState<CreateAddressDto>({
        name: '',
        address: '',
        detailAddress: '',
        zipCode: '',
        isDefault: false,
    });

    const createMutation = useMutation({
        mutationFn: async (data: CreateAddressDto) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create address');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            router.back();
        },
    });

    const handleCompletePostcode = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
        }

        setFormData(prev => ({
            ...prev,
            address: fullAddress,
            zipCode: data.zonecode,
        }));
        setIsOpenPostcode(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.address) {
            alert('주소 별칭과 주소는 필수입니다.');
            return;
        }
        createMutation.mutate(formData);
    };

    if (isOpenPostcode) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col">
                <header className="h-14 flex items-center px-4 border-b border-gray-100">
                    <button onClick={() => setIsOpenPostcode(false)} className="p-2 -ml-2">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg ml-2">주소 검색</h1>
                </header>
                <div className="flex-1">
                    <DaumPostcodeEmbed onComplete={handleCompletePostcode} style={{ height: '100%' }} />
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-4 h-14 flex items-center border-b border-gray-100 sticky top-0 z-50">
                <button onClick={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg ml-2">새 주소 추가</h1>
            </header>

            <form onSubmit={handleSubmit} className="max-w-[568px] mx-auto p-4 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            주소 별칭 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="예: 우리집, 회사"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-yellow"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            주소 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                readOnly
                                value={formData.zipCode}
                                placeholder="우편번호"
                                className="w-24 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                            />
                            <button
                                type="button"
                                onClick={() => setIsOpenPostcode(true)}
                                className="flex-1 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                주소 검색
                            </button>
                        </div>
                        <input
                            type="text"
                            readOnly
                            value={formData.address}
                            placeholder="주소 검색을 눌러주세요"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mb-2 text-gray-500"
                        />
                        <input
                            type="text"
                            placeholder="상세 주소 입력 (예: 101동 101호)"
                            value={formData.detailAddress}
                            onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-yellow"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="w-5 h-5 text-brand-yellow rounded focus:ring-brand-yellow border-gray-300"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-700 select-none">
                            기본 배달지로 설정
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full py-4 bg-brand-yellow text-white font-bold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                    {createMutation.isPending ? '저장 중...' : '저장하기'}
                </button>
            </form>
        </main>
    );
}
