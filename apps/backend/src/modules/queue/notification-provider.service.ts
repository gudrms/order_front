import { Injectable } from '@nestjs/common';
import { NotificationSendEventPayload } from './queue-event.types';

export interface NotificationProviderResult {
    provider: string;
    messageId?: string;
}

@Injectable()
export class NotificationProviderService {
    async send(payload: NotificationSendEventPayload): Promise<NotificationProviderResult> {
        const channel = payload.channel || 'IN_APP';

        if (channel === 'IN_APP') {
            return { provider: 'in_app' };
        }

        const webhookUrl = this.getWebhookUrl(channel);
        if (!webhookUrl) {
            throw new Error(`Notification provider is not configured for ${channel}`);
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.NOTIFICATION_WEBHOOK_SECRET
                    ? { Authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_SECRET}` }
                    : {}),
            },
            body: JSON.stringify({
                channel,
                recipientType: payload.recipientType,
                recipientId: payload.recipientId,
                notificationType: payload.notificationType,
                orderId: payload.orderId,
                storeId: payload.storeId,
                title: payload.title,
                body: payload.body,
                data: payload.data,
            }),
        });

        if (!response.ok) {
            throw new Error(`Notification provider failed with ${response.status}`);
        }

        const result = await this.parseJson(response);
        return {
            provider: 'webhook',
            messageId: typeof result?.messageId === 'string' ? result.messageId : undefined,
        };
    }

    private getWebhookUrl(channel: string): string | undefined {
        const channelKey = `NOTIFICATION_${channel}_WEBHOOK_URL`;
        return process.env[channelKey] || process.env.NOTIFICATION_WEBHOOK_URL;
    }

    private async parseJson(response: Response): Promise<any> {
        try {
            return await response.json();
        } catch {
            return undefined;
        }
    }
}
