import { Module } from '@nestjs/common';
import { OrdersController, RootOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DeliveryOrderService } from './delivery-order.service';
import { PosModule } from '../integrations/pos/pos.module';
import { QueueModule } from '../queue';
import { SessionsModule } from '../sessions/sessions.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
    imports: [PosModule, QueueModule, SessionsModule, CouponsModule],
    controllers: [OrdersController, RootOrdersController],
    providers: [OrdersService, DeliveryOrderService],
    exports: [OrdersService, DeliveryOrderService],
})
export class OrdersModule { }
