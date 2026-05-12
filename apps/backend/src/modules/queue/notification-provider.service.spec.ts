import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationProviderService } from './notification-provider.service';

function makeConfig(env: Record<string, string> = {}) {
    return { get: (key: string) => env[key] } as any;
}

describe('NotificationProviderService', () => {
    let service: NotificationProviderService;
    const originalFetch = global.fetch;

    beforeEach(() => {
        service = new NotificationProviderService(makeConfig());
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('treats in-app notifications as sent without external calls', async () => {
        const fetchMock = vi.fn();
        global.fetch = fetchMock as any;

        const result = await service.send({
            recipientType: 'STORE',
            recipientId: 'store-1',
            notificationType: 'ORDER_PAID',
            orderId: 'order-1',
            channel: 'IN_APP',
        });

        expect(result).toEqual({ provider: 'in_app' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends webhook-backed notifications through the configured webhook', async () => {
        service = new NotificationProviderService(makeConfig({
            NOTIFICATION_WEBHOOK_URL: 'https://notify.example/send',
            NOTIFICATION_WEBHOOK_SECRET: 'secret',
        }));
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ messageId: 'message-1' }),
        });
        global.fetch = fetchMock as any;

        const result = await service.send({
            recipientType: 'CUSTOMER',
            recipientId: 'user-1',
            notificationType: 'DELIVERY_STATUS_CHANGED',
            orderId: 'order-1',
            storeId: 'store-1',
            channel: 'SMS',
        });

        expect(result).toEqual({ provider: 'webhook', messageId: 'message-1' });
        expect(fetchMock).toHaveBeenCalledWith('https://notify.example/send', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                Authorization: 'Bearer secret',
            }),
        }));
    });

    it('sends push notifications through Firebase and removes failed device tokens', async () => {
        const firebaseService = {
            sendPushNotification: vi.fn().mockResolvedValue({
                successCount: 1,
                failureCount: 1,
                failedTokens: ['failed-token'],
            }),
        };
        const prisma = {
            userDevice: {
                findMany: vi.fn().mockResolvedValue([
                    { fcmToken: 'sent-token' },
                    { fcmToken: 'failed-token' },
                ]),
                deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
        };
        service = new NotificationProviderService(makeConfig(), firebaseService as any, prisma as any);

        const result = await service.send({
            recipientType: 'CUSTOMER',
            recipientId: 'user-1',
            notificationType: 'DELIVERY_STATUS_CHANGED',
            orderId: 'order-1',
            storeId: 'store-1',
            channel: 'PUSH',
            title: '주문 상태 변경',
            body: '배달이 시작되었습니다.',
            data: { orderId: 'order-1' },
        });

        expect(result).toEqual({ provider: 'firebase', messageId: 'success:1,fail:1' });
        expect(prisma.userDevice.findMany).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
        });
        expect(firebaseService.sendPushNotification).toHaveBeenCalledWith(
            ['sent-token', 'failed-token'],
            '주문 상태 변경',
            '배달이 시작되었습니다.',
            { orderId: 'order-1' },
        );
        expect(prisma.userDevice.deleteMany).toHaveBeenCalledWith({
            where: { fcmToken: { in: ['failed-token'] } },
        });
    });

    it('fails when a required external provider is not configured', async () => {
        await expect(service.send({
            recipientType: 'CUSTOMER',
            recipientId: 'user-1',
            notificationType: 'ORDER_CONFIRMED',
            orderId: 'order-1',
            channel: 'EMAIL',
        })).rejects.toThrow('Notification provider is not configured for EMAIL');
    });
});
