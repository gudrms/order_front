'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search } from 'lucide-react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import type { CreateUserAddressRequest } from '@order/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateAddress } from '@/hooks/queries/useAddresses';

export default function NewAddressPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const createMutation = useCreateAddress(user?.id);

    const [isOpenPostcode, setIsOpenPostcode] = useState(false);
    const [formData, setFormData] = useState<CreateUserAddressRequest>({
        name: '',
        address: '',
        detailAddress: '',
        zipCode: '',
        recipientName: '',
        recipientPhone: '',
        deliveryMemo: '',
        entranceMemo: '',
        isDefault: false,
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, router, user]);

    const handleCompletePostcode = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname) extraAddress += data.bname;
            if (data.buildingName) {
                extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress ? ` (${extraAddress})` : '';
        }

        setFormData((prev) => ({
            ...prev,
            address: fullAddress,
            zipCode: data.zonecode,
        }));
        setIsOpenPostcode(false);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!formData.name || !formData.address) {
            alert('주소 별칭과 주소는 필수입니다.');
            return;
        }

        createMutation.mutate(formData, {
            onSuccess: () => {
                router.back();
            },
            onError: (error) => {
                alert(error instanceof Error ? error.message : '주소 저장 중 오류가 발생했습니다.');
            },
        });
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </div>
        );
    }

    if (isOpenPostcode) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col">
                <header className="h-14 flex items-center px-4 border-b border-gray-100">
                    <button onClick={() => setIsOpenPostcode(false)} className="p-2 -ml-2" aria-label="닫기">
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
                <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="이전 페이지">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg ml-2">새 주소 추가</h1>
            </header>

            <form onSubmit={handleSubmit} className="max-w-[568px] mx-auto p-4 space-y-4">
                <section className="bg-white p-4 rounded-xl border border-gray-100 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            주소 별칭 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="예: 집, 회사"
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
                                className="w-28 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                            />
                            <button
                                type="button"
                                onClick={() => setIsOpenPostcode(true)}
                                className="flex-1 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Search size={18} />
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
                            placeholder="상세 주소 입력"
                            value={formData.detailAddress}
                            onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-yellow"
                        />
                    </div>
                </section>

                <section className="bg-white p-4 rounded-xl border border-gray-100 space-y-4">
                    <h2 className="font-bold">수령 정보</h2>
                    <input
                        type="text"
                        placeholder="받는 분 이름"
                        value={formData.recipientName}
                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-yellow"
                    />
                    <input
                        type="tel"
                        placeholder="010-1234-5678"
                        value={formData.recipientPhone}
                        onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-yellow"
                    />
                    <input
                        type="text"
                        placeholder="공동현관/출입 메모"
                        value={formData.entranceMemo}
                        onChange={(e) => setFormData({ ...formData, entranceMemo: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-yellow"
                    />
                    <textarea
                        placeholder="배달 요청사항"
                        value={formData.deliveryMemo}
                        onChange={(e) => setFormData({ ...formData, deliveryMemo: e.target.value })}
                        rows={3}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-yellow resize-none"
                    />

                    <label className="flex items-center gap-2 pt-2 text-sm text-gray-700 select-none">
                        <input
                            type="checkbox"
                            checked={!!formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="w-5 h-5 text-brand-yellow rounded focus:ring-brand-yellow border-gray-300"
                        />
                        기본 배달지로 설정
                    </label>
                </section>

                <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full py-4 bg-brand-yellow text-brand-black font-bold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                    {createMutation.isPending ? '저장 중...' : '저장하기'}
                </button>
            </form>
        </main>
    );
}
