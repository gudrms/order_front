import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        // Rate Limiting (DDoS 방지)
        // REDIS_URL이 설정된 경우 Redis 분산 저장소 사용 (Vercel 다중 인스턴스 대응)
        // REDIS_URL 미설정 시 in-memory 폴백 (개발 환경)
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const redisUrl = config.get<string>('REDIS_URL');
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
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
