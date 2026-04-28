import { create } from 'zustand';

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
