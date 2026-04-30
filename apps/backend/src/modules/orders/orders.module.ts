import { Module } from '@nestjs/common';
import { OrdersController, RootOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PosModule } from '../integrations/pos/pos.module';
import { QueueModule } from '../queue';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
    imports: [PosModule, QueueModule, SessionsModule],
    controllers: [OrdersController, RootOrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
