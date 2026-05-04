import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { QueueEventPayload } from '../queue/queue-event.types';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private isInitialized = false;

    onModuleInit() {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            this.logger.warn('Firebase credentials are not fully provided. Push notifications will be disabled.');
            return;
        }

        // privateKey의 줄바꿈 문자 처리 (환경변수에서 넘어올 때 \n 이 escape 되어 있을 수 있음)
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        try {
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
            }
            this.isInitialized = true;
            this.logger.log('Firebase Admin initialized successfully.');
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin', error);
        }
    }

    async sendPushNotification(
        tokens: string[],
        title?: string,
        body?: string,
        data?: QueueEventPayload
    ): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
        if (!this.isInitialized || tokens.length === 0) {
            return { successCount: 0, failureCount: tokens.length, failedTokens: tokens };
        }

        const stringifiedData: Record<string, string> = {};
        if (data) {
            for (const [key, value] of Object.entries(data)) {
                stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
            }
        }

        const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
                title,
                body,
            },
            data: stringifiedData,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK', // Capacitor 처리 등 필요시 변경
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                        contentAvailable: true,
                    },
                },
            },
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            
            const failedTokens: string[] = [];
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                        this.logger.warn(`Failed to send push to token ${tokens[idx]}: ${resp.error?.message}`);
                    }
                });
            }

            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
                failedTokens,
            };
        } catch (error) {
            this.logger.error('Error sending push notification', error);
            throw error;
        }
    }
}
