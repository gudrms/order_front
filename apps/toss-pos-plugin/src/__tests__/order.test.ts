import { describe, it, expect, vi, beforeEach } from 'vitest';

// SDK mock
vi.mock('@tossplace/pos-plugin-sdk', () => ({
    posPluginSdk: {
        order: {
            add: vi.fn().mockResolvedValue({ id: 'toss-order-001' }),
            cancel: vi.fn().mockResolvedValue(undefined),
            on: vi.fn(),
        },
        payment: {
            add: vi.fn().mockResolvedValue({ id: 'toss-payment-001' }),
            cancel: vi.fn().mockResolvedValue(undefined),
            on: vi.fn(),
        },
        catalog: {
            getCatalogs: vi.fn().mockResolvedValue([]),
            on: vi.fn(),
        },
        toast: {
            open: vi.fn(),
        },
    },
}));

// config mock
vi.mock('../config', () => ({
    API_URL: 'http://localhost:4000/api/v1',
    POS_API_KEY: 'pos-secret',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    STORE_ID: 'store-1',
    POLLING_INTERVAL: 30000,
    supabase: {
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        }),
    },
    posApiHeaders: (extraHeaders: Record<string, string> = {}) => ({
        ...extraHeaders,
        'x-pos-api-key': 'pos-secret',
    }),
}));

import { processOrder, updateOrderStatus, pollOrders } from '../order';
import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import { BackendOrder } from '../types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const sampleOrder: BackendOrder = {
    id: 'order-001',
    orderNumber: 'ORD-001',
    totalAmount: 9500,
    note: '문 앞에 두세요',
    payment: {
        paymentKey: 'tgen_test_001',
        approvedNo: '00012345',
        approvedAt: '2026-04-26T10:00:00.000Z',
        amountMoney: 9500,
        supplyMoney: 8636,
        taxMoney: 864,
        tipMoney: 0,
        taxExemptMoney: 0,
    },
    items: [
        {
            menuName: '비프 타코',
            menuPrice: 4500,
            quantity: 2,
            catalogId: '101',
            category: { id: '1', name: '메인 메뉴' },
            options: [
                { name: '매운맛', price: 500, tossOptionCode: '201' },
            ],
        },
    ],
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('processOrder', () => {
    it('주문을 SDK에 등록하고 결제 원장을 생성하고 백엔드 상태를 업데이트한다', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true });

        await processOrder(sampleOrder);

        // SDK order.add 호출 확인 (memo 포함)
        expect(posPluginSdk.order.add).toHaveBeenCalledWith(
            expect.objectContaining({
                memo: '문 앞에 두세요',
                discounts: [],
                lineItems: expect.arrayContaining([
                    expect.objectContaining({
                        diningOption: 'DELIVERY',
                        item: expect.objectContaining({
                            id: 101,
                            title: '비프 타코',
                            type: 'ITEM',
                        }),
                        quantity: { value: 2 },
                        chargePrice: { value: 9000 },
                        optionChoices: [{ id: 201, quantity: 1 }],
                    }),
                ]),
            })
        );

        // SDK payment.add 호출 확인 (EXTERNAL)
        expect(posPluginSdk.payment.add).toHaveBeenCalledWith(
            { id: 'toss-order-001' },
            expect.objectContaining({
                sourceType: 'EXTERNAL',
                orderId: 'toss-order-001',
                amountMoney: 9500,
                taxMoney: 864,
                supplyMoney: 8636,
                paymentKey: 'tgen_test_001',
                approvedNo: '00012345',
            }),
        );

        // 백엔드 상태 업데이트 호출 확인 — Idempotency-Key 헤더 포함
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/v1/pos/orders/order-001/status',
            expect.objectContaining({
                method: 'PATCH',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Idempotency-Key': 'order-order-001-CONFIRMED',
                    'x-pos-api-key': 'pos-secret',
                }),
                body: JSON.stringify({
                    status: 'CONFIRMED',
                    tossOrderId: 'toss-order-001',
                }),
            })
        );
    });

    it('백엔드가 409 Conflict 반환 시 중복 토스 주문을 취소한다', async () => {
        (posPluginSdk.order.add as any).mockResolvedValueOnce({ id: 'toss-duplicate-002' });
        mockFetch.mockResolvedValueOnce({ ok: false, status: 409 });

        await processOrder(sampleOrder);

        expect(posPluginSdk.payment.add).toHaveBeenCalled();
        expect(posPluginSdk.order.cancel).toHaveBeenCalledWith('toss-duplicate-002');
    });

    it('payment.add 실패 시 orphan 토스 주문을 취소하고 백엔드 PATCH를 보내지 않는다', async () => {
        (posPluginSdk.order.add as any).mockResolvedValueOnce({ id: 'toss-orphan-003' });
        (posPluginSdk.payment.add as any).mockRejectedValueOnce(new Error('Payment SDK timeout'));

        await processOrder(sampleOrder);

        expect(posPluginSdk.order.add).toHaveBeenCalledTimes(1);
        expect(posPluginSdk.payment.add).toHaveBeenCalledTimes(1);
        expect(posPluginSdk.order.cancel).toHaveBeenCalledWith('toss-orphan-003');
        // 백엔드 PATCH는 호출되지 않음 → 다음 폴링에서 깨끗이 재시도
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('PATCH가 3회 재시도 모두 실패하면 토스 주문을 취소하여 깨끗한 재시도 가능 상태로 만든다', async () => {
        (posPluginSdk.order.add as any).mockResolvedValueOnce({ id: 'toss-failed-004' });
        // PATCH 3번 모두 실패 (network error)
        mockFetch.mockRejectedValue(new Error('Network error'));

        await processOrder(sampleOrder);

        expect(posPluginSdk.payment.add).toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(posPluginSdk.order.cancel).toHaveBeenCalledWith('toss-failed-004');
    }, 10_000);

    it('미매핑 메뉴는 POS 전송을 skip한다', async () => {
        const unmapped: BackendOrder = {
            ...sampleOrder,
            items: [{ ...sampleOrder.items[0], catalogId: null }],
        };

        await processOrder(unmapped);

        expect(posPluginSdk.order.add).not.toHaveBeenCalled();
        expect(posPluginSdk.payment.add).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('PAID payment 정보가 없으면 skip한다', async () => {
        const noPayment: BackendOrder = { ...sampleOrder, payment: null };

        await processOrder(noPayment);

        expect(posPluginSdk.order.add).not.toHaveBeenCalled();
        expect(posPluginSdk.payment.add).not.toHaveBeenCalled();
    });

    it('중복 주문을 무시한다', async () => {
        // 첫 번째 호출은 느리게, 두 번째는 바로 호출
        (posPluginSdk.order.add as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve({ id: 'toss-001' }), 100))
        );
        mockFetch.mockResolvedValue({ ok: true });

        const first = processOrder(sampleOrder);
        const second = processOrder(sampleOrder);

        await Promise.all([first, second]);

        // SDK는 한 번만 호출되어야 함
        expect(posPluginSdk.order.add).toHaveBeenCalledTimes(1);
    });

    it('SDK 에러 시 처리가 실패하고 재처리 가능하다', async () => {
        (posPluginSdk.order.add as any).mockRejectedValueOnce(new Error('SDK error'));

        await processOrder(sampleOrder);

        // 백엔드 상태 업데이트는 호출되지 않음
        expect(mockFetch).not.toHaveBeenCalled();

        // 다시 처리 가능 (processingOrders에서 제거됨)
        (posPluginSdk.order.add as any).mockResolvedValueOnce({ id: 'toss-002' });
        mockFetch.mockResolvedValueOnce({ ok: true });

        await processOrder(sampleOrder);
        expect(posPluginSdk.order.add).toHaveBeenCalledTimes(2);
    });
    it('POS catalog/category id가 숫자로 변환되지 않으면 skip한다', async () => {
        const invalidMapping: BackendOrder = {
            ...sampleOrder,
            items: [{ ...sampleOrder.items[0], catalogId: 'not-a-number' }],
        };

        await processOrder(invalidMapping);

        expect(posPluginSdk.order.add).not.toHaveBeenCalled();
        expect(posPluginSdk.payment.add).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });
});

describe('updateOrderStatus', () => {
    it('성공 시 한 번만 호출하고 Idempotency-Key 헤더를 포함한다', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true });

        const result = await updateOrderStatus('order-001', { status: 'CONFIRMED', tossOrderId: 'toss-001' });

        expect(result).toBe('OK');
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/v1/pos/orders/order-001/status',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Idempotency-Key': 'order-order-001-CONFIRMED',
                    'x-pos-api-key': 'pos-secret',
                }),
            })
        );
    });

    it('409 응답 시 CONFLICT를 반환하고 재시도하지 않는다', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false, status: 409 });

        const result = await updateOrderStatus('order-001', { status: 'CONFIRMED', tossOrderId: 'toss-001' });

        expect(result).toBe('CONFLICT');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('실패 시 최대 3회 재시도한다', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ ok: true });

        await updateOrderStatus('order-001', { status: 'CONFIRMED', tossOrderId: 'toss-001' });

        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('3회 모두 실패하면 에러 로그를 남긴다', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error');

        await updateOrderStatus('order-001', { status: 'CONFIRMED', tossOrderId: 'toss-001' });

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Failed to update status for order order-001 after 3 retries')
        );
    });
});

describe('pollOrders', () => {
    it('pending 주문이 없으면 아무것도 하지 않는다', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        await pollOrders();

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/v1/pos/orders/pending',
            expect.objectContaining({
                headers: expect.objectContaining({ 'x-pos-api-key': 'pos-secret' }),
            }),
        );
        expect(posPluginSdk.order.add).not.toHaveBeenCalled();
    });

    it('pending 주문이 있으면 처리한다', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([sampleOrder]),
            })
            .mockResolvedValueOnce({ ok: true }); // updateOrderStatus

        await pollOrders();

        expect(posPluginSdk.order.add).toHaveBeenCalledTimes(1);
    });

    it('404 응답은 silent return하지 않고 에러 로그를 남긴다 (배포 실수 신호)', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
        const consoleSpy = vi.spyOn(console, 'error');

        await pollOrders();

        expect(posPluginSdk.order.add).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
            'Order reconciliation error:',
            expect.objectContaining({ message: expect.stringContaining('404') }),
        );
    });

    it('5xx 응답도 에러 로그를 남기고 주문은 처리하지 않는다', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' });
        const consoleSpy = vi.spyOn(console, 'error');

        await pollOrders();

        expect(posPluginSdk.order.add).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
            'Order reconciliation error:',
            expect.objectContaining({ message: expect.stringContaining('503') }),
        );
    });
});
