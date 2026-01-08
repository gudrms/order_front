/**
 * 배달 주소 입력 Bottom Sheet
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { openDaumPostcode, type DaumAddress } from '@order/shared';

interface AddressInputBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function AddressInputBottomSheet({
    isOpen,
    onClose,
    onConfirm,
}: AddressInputBottomSheetProps) {
    const { deliveryInfo, setAddress, setCustomerInfo, setDeliveryRequest } = useDeliveryStore();
    const [isClosing, setIsClosing] = useState(false);

    const [address, setAddressInput] = useState(deliveryInfo.address?.address || '');
    const [detailAddress, setDetailAddress] = useState(deliveryInfo.address?.detailAddress || '');
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

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    const handleConfirm = () => {
        // 유효성 검사
        if (!address || !detailAddress || !customerName || !customerPhone) {
            alert('모든 필수 항목을 입력해주세요.');
            return;
        }

        // 전화번호 형식 간단 검증
        const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phoneRegex.test(customerPhone)) {
            alert('올바른 전화번호를 입력해주세요. (예: 010-1234-5678)');
            return;
        }

        // 스토어에 저장
        setAddress({ address, detailAddress });
        setCustomerInfo(customerName, customerPhone);
        setDeliveryRequest(deliveryRequest);

        onConfirm();
    };

    const handleSearchAddress = async () => {
        try {
            await openDaumPostcode((data: DaumAddress) => {
                // 도로명 주소 우선, 없으면 지번 주소
                const selectedAddress = data.roadAddress || data.jibunAddress;
                setAddressInput(selectedAddress);
            });
        } catch (error) {
            console.error('주소 검색 오류:', error);
            alert('주소 검색 중 오류가 발생했습니다.');
        }
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/50 transition-opacity duration-300",
                    isClosing ? "opacity-0" : "opacity-100"
                )}
                onClick={handleClose}
            />

            {/* Sheet */}
            <div
                className={cn(
                    "relative w-full max-w-[568px] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 transform",
                    isClosing ? "translate-y-full" : "translate-y-0"
                )}
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="font-bold text-lg">배달 정보 입력</h2>
                    <button onClick={handleClose} className="p-2 -mr-2 text-gray-500">
                        <ChevronDown size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    {/* 주소 입력 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            주소 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddressInput(e.target.value)}
                                placeholder="기본 주소 입력"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                            />
                            <button
                                onClick={handleSearchAddress}
                                className="px-4 py-3 bg-brand-yellow text-brand-black font-medium rounded-xl whitespace-nowrap"
                            >
                                <MapPin size={20} />
                            </button>
                        </div>
                    </div>

                    {/* 상세 주소 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            상세 주소 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={detailAddress}
                            onChange={(e) => setDetailAddress(e.target.value)}
                            placeholder="동/호수 입력 (예: 101동 101호)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                        />
                    </div>

                    {/* 주문자 정보 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            주문자 이름 <span className="text-red-500">*</span>
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

                    {/* 배달 요청사항 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            배달 요청사항 (선택)
                        </label>
                        <textarea
                            value={deliveryRequest}
                            onChange={(e) => setDeliveryRequestInput(e.target.value)}
                            placeholder="배달 시 요청사항을 입력해주세요."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
                        />
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <p>• 정확한 주소와 연락처를 입력해주세요.</p>
                        <p>• 배달 소요 시간은 약 30-40분입니다.</p>
                        <p>• 최소 주문 금액은 15,000원입니다.</p>
                    </div>
                </div>

                {/* Footer */}
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
