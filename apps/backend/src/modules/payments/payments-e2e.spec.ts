/**
 * Toss 카드결제 E2E 통합 테스트
 *
 * 테스트 범위:
 *   1. 배달 주문 생성 → Toss 승인 → PAID 확정 → MQ 이벤트 발행
 *   2. 결제 실패 → 주문 취소 + 배달 취소
 *   3. 결제 승인 후 DB 실패 → 보상 취소 자동 수행
 *   4. 결제 완료 후 관리자 전액 환불 → MQ 환불 이벤트 발행
 *   5. 결제 완료 후 부분 환불 → 주문 유지, PARTIAL_REFUNDED
 *   6. 만료 처리 (timeout) → PENDING_PAYMENT 주문 일괄 취소
 *
 * 외부 의존(Toss API)은 mock으로 대체하되, 서비스 간 연결(OrdersService → PaymentsService → QueueService)은
 * 실제 DI 그래프를 따라 end-to-end로 검증합니다.
 */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';

describe('Toss 카드결제 E2E Flow', () => {
    let paymentsService: PaymentsService;
    let ordersService: OrdersService;
    let prisma: any;
    let tx: any;
    let tossApiService: any;
    let queueService: any;

    // ── 공통 fixture ──

    const store = {
        id: 'store-e2e',
        ownerId: 'owner-e2e',
        isActive: true,
        isDeliveryEnabled: true,
        minimumOrderAmount: 10000,
        deliveryFee: 3000,
        freeDeliveryThreshold: 30000,
        estimatedDeliveryMinutes: 40,
    };

    const menu = {
        id: 'menu-e2e',
        name: 'E2E Taco',
        price: 12000,
        isActive: true,
        soldOut: false,
        optionGroups: [],
    };

    const deliveryOrderDto: any = {
        userId: 'user-e2e',
        totalAmount: 15000,  // 12000 + 3000 delivery fee
        items: [{ menuId: 'menu-e2e', quantity: 1 }],
        delivery: {
            recipientName: 'Test Customer',
            recipientPhone: '010-1234-5678',
            address: 'Seoul Test Street',
            detailAddress: '101호',
            zipCode: '12345',
            deliveryMemo: 'Leave at door',
        },
        payment: {
            method: 'TOSS',
            amount: 15000,
            paymentKey: null,   // 결제 승인 전에는 null
            orderId: 'TOSS_ORDER_E2E_001',
        },
    };

    const createdOrder = {
        id: 'order-e2e-1',
        storeId: 'store-e2e',
        userId: 'user-e2e',
        orderNumber: '0001',
        type: 'DELIVERY',
        source: 'DELIVERY_APP',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'READY',
        totalAmount: 15000,
        delivery: { id: 'delivery-e2e-1', status: 'PENDING' },
        payments: [{
            id: 'payment-e2e-1',
            provider: 'TOSS_PAYMENTS',
            providerOrderId: 'TOSS_ORDER_E2E_001',
            idempotencyKey: 'TOSS_ORDER_E2E_001',
            paymentKey: null,
            status: 'READY',
            amount: 15000,
            approvedAmount: null,
            cancelledAmount: 0,
        }],
    };

    // ── Setup ──

    beforeEach(() => {
        tx = {
            store: { findUnique: vi.fn() },
            menu: { findMany: vi.fn() },
            order: {
                count: vi.fn(),
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            payment: { updateMany: vi.fn() },
        };

        prisma = {
            $transaction: vi.fn(async (callbackOrOps) => {
                if (typeof callbackOrOps === 'function') {
                    return callbackOrOps(tx);
                }
                return callbackOrOps;
            }),
            payment: {
                findFirst: vi.fn(),
                findUnique: vi.fn(),
                findMany: vi.fn(),
                update: vi.fn((args) => ({ model: 'payment', args })),
                updateMany: vi.fn(),
            },
            order: {
                findUnique: vi.fn(),
                update: vi.fn((args) => ({ model: 'order', args })),
            },
            user: { findUnique: vi.fn() },
            store: { findUnique: vi.fn() },
        };

        tossApiService = {
            confirmPayment: vi.fn(),
            cancelPayment: vi.fn(),
            fetchPaymentByOrderId: vi.fn(),
        };

        queueService = {
            publishOrderPaid: vi.fn(),
            publishPaymentPaid: vi.fn(),
            publishPosSendOrder: vi.fn(),
            publishPaymentReconcile: vi.fn(),
            publishPaymentRefunded: vi.fn(),
            publishDeliveryStatusChanged: vi.fn(),
        };

        ordersService = new OrdersService(prisma, {} as any, {} as any, queueService);
        paymentsService = new PaymentsService(prisma, tossApiService, queueService);
    });

    // ──────────────────────────────────────────────────────────────────────
    // E2E 시나리오 1: 성공 — 배달 주문 → Toss 승인 → PAID 확정 → MQ 이벤트
    // ──────────────────────────────────────────────────────────────────────

    describe('E2E Scenario 1: 배달 주문 → Toss 카드 승인 → PAID 확정', () => {
        it('Step 1: 배달 주문이 PENDING_PAYMENT 상태로 생성된다', async () => {
            tx.store.findUnique.mockResolvedValue(store);
            tx.menu.findMany.mockResolvedValue([menu]);
            tx.order.count.mockResolvedValue(0);
            tx.order.create.mockResolvedValue(createdOrder);

            const result = await ordersService.createDeliveryOrder('store-e2e', deliveryOrderDto);

            expect(result.status).toBe('PENDING_PAYMENT');
            expect(result.paymentStatus).toBe('READY');
            expect(result.totalAmount).toBe(15000);
            expect(tx.order.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'PENDING_PAYMENT',
                    paymentStatus: 'READY',
                    type: 'DELIVERY',
                    source: 'DELIVERY_APP',
                }),
            }));
        });

        it('Step 2: Toss 결제 승인 → Payment PAID, Order PAID, MQ 이벤트 발행', async () => {
            // 결제 대기 중인 Payment 레코드
            prisma.payment.findFirst.mockResolvedValue({
                ...createdOrder.payments[0],
                orderId: createdOrder.id,
                order: {
                    id: createdOrder.id,
                    storeId: store.id,
                    totalAmount: 15000,
                    delivery: createdOrder.delivery,
                },
            });
            prisma.payment.updateMany.mockResolvedValue({ count: 1 });

            // Toss API 승인 성공 응답
            tossApiService.confirmPayment.mockResolvedValue({
                paymentKey: 'tgen_e2e_card_key_001',
                method: '카드',
                status: 'DONE',
                approvedAt: '2026-05-01T12:00:00+09:00',
                totalAmount: 15000,
                receipt: { url: 'https://receipt.tosspayments.com/e2e-test' },
                card: {
                    company: '신한',
                    number: '****1234',
                    installmentPlanMonths: 0,
                },
            });

            // 승인 후 주문 조회 (getOrderResponse)
            prisma.order.findUnique.mockResolvedValue({
                ...createdOrder,
                status: 'PAID',
                paymentStatus: 'PAID',
                payments: [{
                    ...createdOrder.payments[0],
                    status: 'PAID',
                    paymentKey: 'tgen_e2e_card_key_001',
                    method: 'CARD',
                    approvedAmount: 15000,
                }],
            });

            const result = await paymentsService.confirmTossPayment({
                paymentKey: 'tgen_e2e_card_key_001',
                orderId: 'TOSS_ORDER_E2E_001',
                amount: 15000,
            });

            // ── 검증 ──
            expect(result.status).toBe('PAID');
            expect(result.paymentStatus).toBe('PAID');

            // Toss API 호출 검증
            expect(tossApiService.confirmPayment).toHaveBeenCalledWith({
                paymentKey: 'tgen_e2e_card_key_001',
                orderId: 'TOSS_ORDER_E2E_001',
                amount: 15000,
                idempotencyKey: 'TOSS_ORDER_E2E_001',
            });

            // DB 상태 업데이트 검증
            expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'PAID',
                    method: 'CARD',
                    approvedAmount: 15000,
                    receiptUrl: 'https://receipt.tosspayments.com/e2e-test',
                }),
            }));
            expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'PAID', paymentStatus: 'PAID' },
            }));

            // MQ 이벤트 발행 검증: payment.paid + order.paid
            expect(queueService.publishPaymentPaid).toHaveBeenCalledWith({
                orderId: createdOrder.id,
                storeId: store.id,
                paymentId: createdOrder.payments[0].id,
                providerOrderId: 'TOSS_ORDER_E2E_001',
                amount: 15000,
            });
            expect(queueService.publishOrderPaid).toHaveBeenCalledWith({
                orderId: createdOrder.id,
                storeId: store.id,
                paymentId: createdOrder.payments[0].id,
                providerOrderId: 'TOSS_ORDER_E2E_001',
                amount: 15000,
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────
    // E2E 시나리오 2: 실패 — 결제 실패 → 주문/배달 취소
    // ──────────────────────────────────────────────────────────────────────

    describe('E2E Scenario 2: Toss 결제 실패 → 주문/배달 일괄 취소', () => {
        it('결제 실패 시 Order CANCELLED, Payment FAILED, Delivery CANCELLED', async () => {
            prisma.payment.findFirst.mockResolvedValue({
                ...createdOrder.payments[0],
                orderId: createdOrder.id,
                order: {
                    id: createdOrder.id,
                    totalAmount: 15000,
                    delivery: createdOrder.delivery,
                },
            });
            prisma.order.findUnique.mockResolvedValue({
                ...createdOrder,
                status: 'CANCELLED',
                paymentStatus: 'FAILED',
            });

            const result = await paymentsService.failTossPayment({
                orderId: 'TOSS_ORDER_E2E_001',
                code: 'PAY_PROCESS_CANCELED',
                message: '사용자가 결제를 취소했습니다.',
            });

            expect(result.status).toBe('CANCELLED');
            expect(result.paymentStatus).toBe('FAILED');

            // Payment: FAILED
            expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'FAILED',
                    failureCode: 'PAY_PROCESS_CANCELED',
                    failureMessage: '사용자가 결제를 취소했습니다.',
                }),
            }));

            // Order: CANCELLED + Delivery: CANCELLED
            expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED',
                    delivery: {
                        update: expect.objectContaining({
                            status: 'CANCELLED',
                        }),
                    },
                }),
            }));

            // 결제 실패이므로 MQ 이벤트 미발행
            expect(queueService.publishOrderPaid).not.toHaveBeenCalled();
            expect(queueService.publishPaymentRefunded).not.toHaveBeenCalled();
        });
    });

    // ──────────────────────────────────────────────────────────────────────
    // E2E 시나리오 3: 보상 취소 — Toss 승인 OK → DB 실패 → 자동 환불
    // ──────────────────────────────────────────────────────────────────────

    describe('E2E Scenario 3: Toss 승인 후 DB 실패 → 보상 취소', () => {
        it('DB commit 실패 시 Toss cancelPayment가 자동 호출되고 MQ 이벤트는 발행되지 않는다', async () => {
            prisma.payment.findFirst.mockResolvedValue({
                ...createdOrder.payments[0],
                orderId: createdOrder.id,
                order: {
                    id: createdOrder.id,
                    storeId: store.id,
                    totalAmount: 15000,
                    delivery: createdOrder.delivery,
                },
            });
            prisma.payment.updateMany.mockResolvedValue({ count: 1 });

            // Toss 승인 성공
            tossApiService.confirmPayment.mockResolvedValue({
                method: '카드',
                approvedAt: '2026-05-01T12:00:00+09:00',
                receipt: { url: 'https://receipt.example' },
            });

            // DB $transaction 실패 시뮬레이션
            prisma.$transaction.mockRejectedValue(new Error('DB connection lost'));

            // 보상 취소 성공
            tossApiService.cancelPayment.mockResolvedValue({ status: 'CANCELED' });

            // 보상 취소 후 Payment 업데이트 (best-effort)
            prisma.payment.update.mockResolvedValue({});

            await expect(paymentsService.confirmTossPayment({
                paymentKey: 'tgen_e2e_compensation_key',
                orderId: 'TOSS_ORDER_E2E_001',
                amount: 15000,
            })).rejects.toThrow('DB connection lost');

            // 보상 취소 호출 검증
            expect(tossApiService.cancelPayment).toHaveBeenCalledWith({
                paymentKey: 'tgen_e2e_compensation_key',
                cancelReason: 'Local DB confirmation failed - automatic compensation',
                idempotencyKey: expect.stringMatching(/^compensation-payment-e2e-1-/),
            });

            // MQ 이벤트 미발행 검증
            expect(queueService.publishOrderPaid).not.toHaveBeenCalled();
            expect(queueService.publishPaymentPaid).not.toHaveBeenCalled();
        });
    });

    // ──────────────────────────────────────────────────────────────────────
    // E2E 시나리오 4: 관리자 전액 환불
    // ──────────────────────────────────────────────────────────────────────

    describe('E2E Scenario 4: 결제 완료 후 관리자 전액 환불', () => {
        it('전액 환불 → Order CANCELLED, Payment REFUNDED, MQ payment.refunded 발행', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'owner-e2e', role: 'OWNER' });
            prisma.store.findUnique.mockResolvedValue(store);
            prisma.payment.findFirst.mockResolvedValue({
                id: 'payment-e2e-1',
                orderId: 'order-e2e-1',
                provider: 'TOSS_PAYMENTS',
                providerOrderId: 'TOSS_ORDER_E2E_001',
                status: 'PAID',
                paymentKey: 'tgen_e2e_card_key_001',
                amount: 15000,
                approvedAmount: 15000,
                cancelledAmount: 0,
                order: {
                    id: 'order-e2e-1',
                    storeId: 'store-e2e',
                    totalAmount: 15000,
                    store: store,
                    delivery: { id: 'delivery-e2e-1' },
                },
            });

            tossApiService.cancelPayment.mockResolvedValue({
                paymentKey: 'tgen_e2e_card_key_001',
                cancels: [{ cancelAmount: 15000 }],
            });

            prisma.order.findUnique.mockResolvedValue({
                id: 'order-e2e-1',
                status: 'CANCELLED',
                paymentStatus: 'REFUNDED',
                delivery: { status: 'CANCELLED' },
                payments: [{ id: 'payment-e2e-1', status: 'REFUNDED', cancelledAmount: 15000 }],
                items: [],
            });

            const result = await paymentsService.cancelOrderTossPayment(
                'owner-e2e',
                'order-e2e-1',
                { cancelReason: '고객 요청 전액 환불' },
            );

            expect(result.status).toBe('CANCELLED');
            expect(result.paymentStatus).toBe('REFUNDED');

            // Toss 취소 API 호출 검증 (전액이므로 cancelAmount: undefined)
            expect(tossApiService.cancelPayment).toHaveBeenCalledWith({
                paymentKey: 'tgen_e2e_card_key_001',
                cancelReason: '고객 요청 전액 환불',
                cancelAmount: undefined,
                idempotencyKey: 'cancel-payment-e2e-1-15000',
            });

            // DB 업데이트: Order CANCELLED + Delivery CANCELLED
            expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'CANCELLED',
                    paymentStatus: 'REFUNDED',
                    delivery: {
                        update: expect.objectContaining({ status: 'CANCELLED' }),
                    },
                }),
            }));

            // MQ: payment.refunded 이벤트 발행 검증
            expect(queueService.publishPaymentRefunded).toHaveBeenCalledWith({
                paymentId: 'payment-e2e-1',
                orderId: 'order-e2e-1',
                storeId: 'store-e2e',
                providerOrderId: 'TOSS_ORDER_E2E_001',
                refundedAmount: 15000,
                totalCancelledAmount: 15000,
                isFullRefund: true,
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────
    // E2E 시나리오 5: 부분 환불
    // ──────────────────────────────────────────────────────────────────────

    describe('E2E Scenario 5: 부분 환불 → 주문 유지', () => {
        it('부분 환불 시 Order 유지, Payment PARTIAL_REFUNDED, 올바른 금액 추적', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'owner-e2e', role: 'OWNER' });
            prisma.store.findUnique.mockResolvedValue(store);
            prisma.payment.findFirst.mockResolvedValue({
                id: 'payment-e2e-1',
                orderId: 'order-e2e-1',
                provider: 'TOSS_PAYMENTS',
                providerOrderId: 'TOSS_ORDER_E2E_001',
                status: 'PAID',
                paymentKey: 'tgen_e2e_card_key_001',
                amount: 15000,
                approvedAmount: 15000,
                cancelledAmount: 0,
                order: {
                    id: 'order-e2e-1',
                    storeId: 'store-e2e',
                    totalAmount: 15000,
                    store: store,
                    delivery: null,
                },
            });

            tossApiService.cancelPayment.mockResolvedValue({
                paymentKey: 'tgen_e2e_card_key_001',
                cancels: [{ cancelAmount: 5000 }],
            });

            prisma.order.findUnique.mockResolvedValue({
                id: 'order-e2e-1',
                status: 'PAID',
                paymentStatus: 'PARTIAL_REFUNDED',
                payments: [{ id: 'payment-e2e-1', status: 'PARTIAL_REFUNDED', cancelledAmount: 5000 }],
                items: [],
            });

            const result = await paymentsService.cancelOrderTossPayment(
                'owner-e2e',
                'order-e2e-1',
                { cancelReason: '배달비 조정', cancelAmount: 5000 },
            );

            expect(result.status).toBe('PAID');
            expect(result.paymentStatus).toBe('PARTIAL_REFUNDED');

            // 부분 환불 시 cancelAmount 전달
            expect(tossApiService.cancelPayment).toHaveBeenCalledWith(expect.objectContaining({
                cancelAmount: 5000,
            }));

            // 주문은 CANCELLED가 아닌 PAID 유지 (paymentStatus만 변경)
            expect(prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order-e2e-1' },
                data: { paymentStatus: 'PARTIAL_REFUNDED' },
            });

            expect(queueService.publishPaymentRefunded).toHaveBeenCalledWith({
                paymentId: 'payment-e2e-1',
                orderId: 'order-e2e-1',
                storeId: 'store-e2e',
                providerOrderId: 'TOSS_ORDER_E2E_001',
                refundedAmount: 5000,
                totalCancelledAmount: 5000,
                isFullRefund: false,
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────
    // E2E 시나리오 6: 결제 타임아웃 만료 처리
    // ──────────────────────────────────────────────────────────────────────

    describe('E2E Scenario 6: 결제 타임아웃 → 일괄 만료 처리', () => {
        it('15분 이상 미승인 주문이 CANCELLED + FAILED 처리되고 배달도 취소된다', async () => {
            const stalePendingPayment = {
                id: 'payment-stale-1',
                orderId: 'order-stale-1',
                provider: 'TOSS_PAYMENTS',
                status: 'READY',
                amount: 15000,
                requestedAt: new Date(Date.now() - 20 * 60 * 1000),  // 20분 전
                order: {
                    id: 'order-stale-1',
                    status: 'PENDING_PAYMENT',
                    delivery: { id: 'delivery-stale-1' },
                },
            };

            prisma.payment.findMany.mockResolvedValue([stalePendingPayment]);

            const result = await paymentsService.expirePendingTossPayments({ olderThanMinutes: 15 });

            expect(result.expiredCount).toBe(1);
            expect(result.orderIds).toEqual(['order-stale-1']);

            // Payment: FAILED + PAYMENT_TIMEOUT
            expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'payment-stale-1' },
                data: expect.objectContaining({
                    status: 'FAILED',
                    failureCode: 'PAYMENT_TIMEOUT',
                }),
            }));

            // Order: CANCELLED + Delivery: CANCELLED
            expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'order-stale-1' },
                data: expect.objectContaining({
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED',
                    delivery: {
                        update: expect.objectContaining({
                            status: 'CANCELLED',
                        }),
                    },
                }),
            }));
        });
    });
});
