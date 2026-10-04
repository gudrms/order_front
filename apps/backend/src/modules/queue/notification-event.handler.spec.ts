import { describe, expect, it } from 'vitest';
import { buildNotificationDedupeKey } from './notification-event.handler';

describe('buildNotificationDedupeKey', () => {
    const base = { recipientType: 'CUSTOMER' as const, recipientId: 'user-1', notificationType: 'DELIVERY_STATUS_CHANGED' as const, orderId: 'order-1', channel: 'PUSH' as const };

    it('keeps the legacy key when no status is given', () => {
        expect(buildNotificationDedupeKey(base)).toBe('user-1:DELIVERY_STATUS_CHANGED:order-1:PUSH');
    });

    it('separates notifications for different statuses of the same order', () => {
        // 같은 주문의 상태 알림이 하나의 키로 묶여 두 번째부터 발송되지 않던 문제
        expect(buildNotificationDedupeKey({ ...base, orderStatus: 'PICKED_UP' }))
            .not.toBe(buildNotificationDedupeKey({ ...base, orderStatus: 'DELIVERED' }));
    });
});
