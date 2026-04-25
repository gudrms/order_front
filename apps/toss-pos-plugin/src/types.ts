// SDK 타입은 @tossplace/pos-plugin-sdk에서 직접 import
// PluginOrderDto, PluginCatalogCategory 등은 SDK 제공 타입 사용

// --- Backend Order (백엔드 pending orders API 응답) ---

export interface BackendOrder {
    id: string;
    orderNumber: string;
    totalAmount: number;
    note: string | null;
    payment: BackendPayment | null;
    items: BackendOrderItem[];
}

export interface BackendPayment {
    paymentKey: string;
    approvedNo: string;
    approvedAt: string;
    amountMoney: number;
    supplyMoney: number;
    taxMoney: number;
    tipMoney: number;
    taxExemptMoney: number;
}

export interface BackendOrderItem {
    menuName: string;
    menuPrice: number;
    quantity: number;
    catalogId: string | null;
    category: { id: string; name: string } | null;
    options: BackendOrderOption[];
}

export interface BackendOrderOption {
    name: string;
    price: number;
    tossOptionCode: string | null;
}
