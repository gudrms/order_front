import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationProviderService } from './notification-provider.service';

describe('NotificationProviderService', () => {
    let service: NotificationProviderService;
    const originalFetch = global.fetch;
    const originalEnv = process.env;

    beforeEach(() => {
        service = new NotificationProviderService();
        process.env = { ...originalEnv };
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
        global.fetch = originalFetch;
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

    it('sends non in-app notifications through the configured webhook', async () => {
        process.env.NOTIFICATION_WEBHOOK_URL = 'https://notify.example/send';
        process.env.NOTIFICATION_WEBHOOK_SECRET = 'secret';
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
            channel: 'PUSH',
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
