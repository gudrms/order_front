import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from './modules/queue';
import { NotificationsModule } from './modules/notifications/notifications.module';

/**
 * Slim module for Vercel queue function (api/queue.ts).
 * Only loads what queue processing needs — omits HTTP-facing modules
 * (Auth, Menus, Orders, Stores, Sessions, Payments, Coupons, etc.)
 * to reduce cold start time.
 *
 * QueueModule already imports: PrismaModule, TossModule, PosModule.
 * NotificationsModule provides FirebaseService for push notifications.
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                DATABASE_URL: Joi.string().required(),
                SUPABASE_URL: Joi.string().required(),
                SUPABASE_SERVICE_KEY: Joi.string().required(),
                TOSS_ACCESS_KEY: Joi.string().required(),
                TOSS_ACCESS_SECRET: Joi.string().required(),
                TOSS_PAYMENTS_SECRET_KEY: Joi.string().optional(),
                TOSS_SECRET_KEY: Joi.string().optional(),
                INTERNAL_JOB_SECRET: Joi.string().min(16).required(),
                REDIS_URL: Joi.string().optional(),
                NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                BACKEND_QUEUE_NAME: Joi.string().default('backend_events'),
            }),
            validationOptions: { allowUnknown: true, abortEarly: false },
        }),
        QueueModule,
        NotificationsModule,
    ],
})
export class QueueAppModule {}
