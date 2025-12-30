import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { MenusModule } from './modules/menus/menus.module';
import { StoresModule } from './modules/stores/stores.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthController } from './health.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        MenusModule,
        StoresModule,
        OrdersModule,
        AuthModule,
    ],
    controllers: [HealthController],
})
export class AppModule { }
