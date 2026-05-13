import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MenusModule } from './modules/menus/menus.module';
import { StoresModule } from './modules/stores/stores.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from './common/logger';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { ErrorLogsModule } from './modules/error-logs/error-logs.module';
import { TossModule } from './modules/integrations/toss/toss.module';
import { UsersModule } from './modules/users/users.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { QueueModule } from './modules/queue';
import { CouponsModule } from './modules/coupons/coupons.module';
import { CallsModule } from './modules/calls/calls.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FranchiseInquiriesModule } from './modules/franchise-inquiries/franchise-inquiries.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';

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
                PORT: Joi.number().default(4000),
                LOG_LEVEL: Joi.string().default('info'),
                BACKEND_QUEUE_NAME: Joi.string().default('backend_events'),
            }),
            validationOptions: { allowUnknown: true, abortEarly: false },
        }),
        // Rate Limiting (DDoS 방지)
        // REDIS_URL이 설정된 경우 Redis 분산 저장소 사용 (Vercel 다중 인스턴스 대응)
        // REDIS_URL 미설정 시 in-memory 폴백 — 인스턴스별 카운터이므로 분산 환경에서
        // rate limit이 인스턴스 수만큼 배수로 허용될 수 있음 (성능 저하 모드)
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const redisUrl = config.get<string>('REDIS_URL');
                if (!redisUrl && config.get<string>('NODE_ENV') === 'production') {
                    console.warn(
                        '[ThrottlerModule] REDIS_URL is not set in production. ' +
                        'Rate limiting is running in degraded mode (per-instance, not distributed). ' +
                        'Set REDIS_URL to enable shared rate limiting across instances.',
                    );
                }
                return {
                    throttlers: [
                        { name: 'short',  ttl: 1000,   limit: 10   }, // 1초  10회
                        { name: 'medium', ttl: 60000,  limit: 100  }, // 1분  100회
                        { name: 'long',   ttl: 900000, limit: 1000 }, // 15분 1000회
                    ],
                    ...(redisUrl && {
                        storage: new ThrottlerStorageRedisService(new Redis(redisUrl)),
                    }),
                };
            },
        }),
        LoggerModule,
        PrismaModule,
        MenusModule,
        StoresModule,
        OrdersModule,
        SessionsModule,
        AuthModule,
        ErrorLogsModule,
        TossModule,
        UsersModule,
        PaymentsModule,
        QueueModule,
        CouponsModule,
        CallsModule,
        NotificationsModule,
        FranchiseInquiriesModule,
    ],
    controllers: [AppController, HealthController],
    providers: [
        // Global Rate Limiting Guard
        {
            provide: APP_GUARD,
            useClass: CustomThrottlerGuard,
        },
    ],
})
export class AppModule { }
