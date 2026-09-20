import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OrderType = 'DELIVERY' | 'TAKEOUT' | 'DINE_IN';

export interface DeliveryAddress {
    id?: string;
    name?: string;
    address: string;
    detailAddress?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
}

export interface DeliveryInfo {
    orderType: OrderType;
    address?: DeliveryAddress;
    customerName?: string;
    customerPhone?: string;
    deliveryRequest?: string;
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

/**
 * 받는 분 이름·연락처는 매번 다시 입력하지 않도록 기기에 저장한다.
 * (주소는 서버의 저장 주소 목록에서 불러오므로 제외)
 *
 * 공용 기기에서 다음 사용자에게 남지 않도록 로그아웃 시 clearDeliveryInfo()로
 * 초기화되며, 그 시점에 저장값도 같이 비워진다.
 */
export const useDeliveryStore = create<DeliveryStore>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'delivery-customer-info',
            partialize: (state) => ({
                deliveryInfo: {
                    orderType: state.deliveryInfo.orderType,
                    customerName: state.deliveryInfo.customerName,
                    customerPhone: state.deliveryInfo.customerPhone,
                },
            }),
        }
    )
);
