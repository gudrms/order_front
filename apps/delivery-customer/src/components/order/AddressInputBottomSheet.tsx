'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, MapPin } from 'lucide-react';
import type { UserAddress } from '@order/shared';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useAddresses } from '@/hooks/queries/useAddresses';
import { openDaumPostcode, type DaumAddress } from '@order/shared';

interface AddressInputBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

function toNumber(value: UserAddress['latitude']): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

export default function AddressInputBottomSheet({
    isOpen,
    onClose,
    onConfirm,
}: AddressInputBottomSheetProps) {
    const { user } = useAuth();
    const { deliveryInfo, setAddress, setCustomerInfo, setDeliveryRequest } = useDeliveryStore();
    const { data: savedAddresses = [] } = useAddresses(user?.id);
    const [isClosing, setIsClosing] = useState(false);

    const [selectedAddressId, setSelectedAddressId] = useState(deliveryInfo.address?.id || '');
    const [address, setAddressInput] = useState(deliveryInfo.address?.address || '');
    const [detailAddress, setDetailAddress] = useState(deliveryInfo.address?.detailAddress || '');
    const [zipCode, setZipCode] = useState(deliveryInfo.address?.zipCode || '');
    const [customerName, setCustomerName] = useState(deliveryInfo.customerName || '');
    const [customerPhone, setCustomerPhone] = useState(deliveryInfo.customerPhone || '');
    const [deliveryRequest, setDeliveryRequestInput] = useState(deliveryInfo.deliveryRequest || '');

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || deliveryInfo.address?.address || savedAddresses.length === 0) return;

        const defaultAddress = savedAddresses.find((item) => item.isDefault) || savedAddresses[0];
        applySavedAddress(defaultAddress);
    }, [deliveryInfo.address?.address, isOpen, savedAddresses]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    const applySavedAddress = (savedAddress: UserAddress) => {
        setSelectedAddressId(savedAddress.id);
        setAddressInput(savedAddress.address);
        setDetailAddress(savedAddress.detailAddress || '');
        setZipCode(savedAddress.zipCode || '');
        setCustomerName(savedAddress.recipientName || customerName);
        setCustomerPhone(savedAddress.recipientPhone || customerPhone);
        setDeliveryRequestInput(savedAddress.deliveryMemo || deliveryRequest);
    };

    const handleConfirm = () => {
        if (!address || !customerName || !customerPhone) {
            alert('주소, 받는 분 이름, 연락처를 입력해주세요.');
            return;
        }

        const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phoneRegex.test(customerPhone)) {
            alert('올바른 휴대폰 번호를 입력해주세요. 예: 010-1234-5678');
            return;
        }

        const savedAddress = savedAddresses.find((item) => item.id === selectedAddressId);

        setAddress({
            id: selectedAddressId || undefined,
            name: savedAddress?.name,
            address,
            detailAddress,
            zipCode,
            latitude: toNumber(savedAddress?.latitude),
            longitude: toNumber(savedAddress?.longitude),
        });
        setCustomerInfo(customerName, customerPhone);
        setDeliveryRequest(deliveryRequest);

        onConfirm();
    };

    const handleSearchAddress = async () => {
        try {
            await openDaumPostcode((data: DaumAddress) => {
                const selectedAddress = data.roadAddress || data.jibunAddress || data.address;
                setSelectedAddressId('');
                setAddressInput(selectedAddress);
                setZipCode(data.zonecode);
            });
        } catch (error) {
            console.error('주소 검색 오류:', error);
            alert('주소 검색 중 오류가 발생했습니다.');
        }
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div
                className={cn(
                    'absolute inset-0 bg-black/50 transition-opacity duration-300',
                    isClosing ? 'opacity-0' : 'opacity-100'
                )}
                onClick={handleClose}
            />

            <div
                className={cn(
                    'relative w-full max-w-[568px] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 transform',
                    isClosing ? 'translate-y-full' : 'translate-y-0'
                )}
                style={{ maxHeight: '90vh' }}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="font-bold text-lg">배달 정보 입력</h2>
                    <button onClick={handleClose} className="p-2 -mr-2 text-gray-500" aria-label="닫기">
                        <ChevronDown size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    {savedAddresses.length > 0 && (
                        <section className="space-y-2">
                            <p className="text-sm font-bold text-gray-800">저장된 주소</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {savedAddresses.map((savedAddress) => (
                                    <button
                                        key={savedAddress.id}
                                        onClick={() => applySavedAddress(savedAddress)}
                                        className={cn(
                                            'min-w-[180px] rounded-xl border p-3 text-left text-sm',
                                            selectedAddressId === savedAddress.id
                                                ? 'border-brand-yellow bg-yellow-50'
                                                : 'border-gray-200 bg-white'
                                        )}
                                    >
                                        <div className="flex items-center gap-1 font-bold text-gray-900">
                                            {selectedAddressId === savedAddress.id && <CheckCircle2 size={16} />}
                                            {savedAddress.name}
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-gray-500">{savedAddress.address}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            주소 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => {
                                    setSelectedAddressId('');
                                    setAddressInput(e.target.value);
                                }}
                                placeholder="기본 주소 입력"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                            />
                            <button
                                onClick={handleSearchAddress}
                                className="px-4 py-3 bg-brand-yellow text-brand-black font-medium rounded-xl whitespace-nowrap"
                                aria-label="주소 검색"
                            >
                                <MapPin size={20} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">상세 주소</label>
                        <input
                            type="text"
                            value={detailAddress}
                            onChange={(e) => setDetailAddress(e.target.value)}
                            placeholder="예: 101동 101호"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            받는 분 이름 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="이름 입력"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            연락처 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="010-1234-5678"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">배달 요청사항</label>
                        <textarea
                            value={deliveryRequest}
                            onChange={(e) => setDeliveryRequestInput(e.target.value)}
                            placeholder="배달 시 요청사항을 입력해주세요."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
                        />
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <p>정확한 주소와 연락처를 입력해주세요.</p>
                        <p>저장 주소 관리는 마이페이지 &gt; 주소 관리에서 할 수 있습니다.</p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white pb-8">
                    <button
                        onClick={handleConfirm}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold text-lg"
                    >
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
}
