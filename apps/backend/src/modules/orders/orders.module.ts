import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PosModule } from '../integrations/pos/pos.module';

@Module({
    imports: [PosModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
