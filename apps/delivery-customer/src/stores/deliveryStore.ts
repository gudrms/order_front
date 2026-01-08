/**
 * 배달 정보 스토어
 */

import { create } from 'zustand';

export type OrderType = 'DELIVERY' | 'TAKEOUT' | 'DINE_IN';

export interface DeliveryAddress {
    address: string; // 기본 주소
    detailAddress?: string; // 상세 주소 (동/호수)
    zipCode?: string; // 우편번호
    latitude?: number; // 위도
    longitude?: number; // 경도
}

export interface DeliveryInfo {
    orderType: OrderType; // 주문 방식
    address?: DeliveryAddress; // 배달 주소 (배달 주문 시만)
    customerName?: string; // 주문자 이름
    customerPhone?: string; // 주문자 연락처
    deliveryRequest?: string; // 배달 요청사항
}

interface DeliveryState {
    deliveryInfo: DeliveryInfo;
}

interface DeliveryActions {
    setOrderType: (orderType: OrderType) => void;
    setAddress: (address: DeliveryAddress) => void;
    setCustomerInfo: (name: string, phone: string) => void;
    setDeliveryRequest: (request: string) => void;
    clearDeliveryInfo: () => void;
}

type DeliveryStore = DeliveryState & DeliveryActions;

const initialDeliveryInfo: DeliveryInfo = {
    orderType: 'DELIVERY',
};

export const useDeliveryStore = create<DeliveryStore>((set) => ({
    deliveryInfo: initialDeliveryInfo,

    setOrderType: (orderType) => {
        set((state) => ({
            deliveryInfo: { ...state.deliveryInfo, orderType },
        }));
    },

    setAddress: (address) => {
        set((state) => ({
            deliveryInfo: { ...state.deliveryInfo, address },
        }));
    },

    setCustomerInfo: (name, phone) => {
        set((state) => ({
            deliveryInfo: {
                ...state.deliveryInfo,
                customerName: name,
                customerPhone: phone,
            },
        }));
    },

    setDeliveryRequest: (request) => {
        set((state) => ({
            deliveryInfo: { ...state.deliveryInfo, deliveryRequest: request },
        }));
    },

    clearDeliveryInfo: () => {
        set({ deliveryInfo: initialDeliveryInfo });
    },
}));
