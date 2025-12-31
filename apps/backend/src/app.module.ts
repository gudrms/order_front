import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        // Rate Limiting (DDoS 방지)
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,  // 1초
                limit: 10,  // 1초에 10개 요청
            },
            {
                name: 'medium',
                ttl: 60000, // 1분
                limit: 100, // 1분에 100개 요청
            },
            {
                name: 'long',
                ttl: 900000, // 15분
                limit: 1000, // 15분에 1000개 요청
            },
        ]),
        LoggerModule,
        PrismaModule,
        MenusModule,
        StoresModule,
        OrdersModule,
        SessionsModule,
        AuthModule,
        ErrorLogsModule,
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
