import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PosModule } from '../integrations/pos/pos.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
    imports: [PosModule, SessionsModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
