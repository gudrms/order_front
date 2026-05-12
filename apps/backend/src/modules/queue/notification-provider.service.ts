import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationSendEventPayload } from './queue-event.types';
import { FirebaseService } from '../notifications/firebase.service';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationProviderResult {
    provider: string;
    messageId?: string;
}

@Injectable()
export class NotificationProviderService {
    constructor(
        private readonly config: ConfigService,
        @Optional() private readonly firebaseService?: FirebaseService,
        @Optional() private readonly prisma?: PrismaService,
    ) {}

    async send(payload: NotificationSendEventPayload): Promise<NotificationProviderResult> {
        const channel = payload.channel || 'IN_APP';

        if (channel === 'IN_APP') {
            return { provider: 'in_app' };
        }

        if (channel === 'PUSH') {
            if (!this.firebaseService || !this.prisma) {
                throw new Error('FirebaseService or PrismaService is not available for PUSH channel');
            }

            // 토큰을 찾을 대상 유저 ID 결정
            let targetUserId: string | null = null;

            if (payload.recipientType === 'STORE' && payload.recipientId) {
                // 매장의 ownerId 찾기
                const store = await this.prisma.store.findUnique({
                    where: { id: payload.recipientId },
                    select: { ownerId: true },
                });
                targetUserId = store?.ownerId || null;
            } else if (payload.recipientType === 'CUSTOMER' && payload.recipientId) {
                // 고객은 recipientId가 userId임
                targetUserId = payload.recipientId;
            }

            if (!targetUserId) {
                return { provider: 'firebase', messageId: 'skipped_no_user' };
            }

            // 해당 유저의 모든 기기 토큰 조회
            const devices = await this.prisma.userDevice.findMany({
                where: { userId: targetUserId },
            });

            const tokens = devices.map(d => d.fcmToken);

            if (tokens.length === 0) {
                return { provider: 'firebase', messageId: 'skipped_no_devices' };
            }

            // Firebase 푸시 발송
            const result = await this.firebaseService.sendPushNotification(
                tokens,
                payload.title || '알림',
                payload.body || '',
                payload.data
            );

            // 실패한 토큰 정리 로직(선택사항)
            if (result.failedTokens.length > 0) {
                await this.prisma.userDevice.deleteMany({
                    where: { fcmToken: { in: result.failedTokens } },
                });
            }

            return { 
                provider: 'firebase', 
                messageId: `success:${result.successCount},fail:${result.failureCount}` 
            };
        }

        const webhookUrl = this.getWebhookUrl(channel);
        if (!webhookUrl) {
            throw new Error(`Notification provider is not configured for ${channel}`);
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.get<string>('NOTIFICATION_WEBHOOK_SECRET')
                    ? { Authorization: `Bearer ${this.config.get<string>('NOTIFICATION_WEBHOOK_SECRET')}` }
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
        return this.config.get<string>(channelKey) || this.config.get<string>('NOTIFICATION_WEBHOOK_URL');
    }

    private async parseJson(response: Response): Promise<any> {
        try {
            return await response.json();
        } catch {
            return undefined;
        }
    }
}
