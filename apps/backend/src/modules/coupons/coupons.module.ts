import { Module } from '@nestjs/common';
import { CouponsController, UserCouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CouponsController, UserCouponsController],
    providers: [CouponsService],
    exports: [CouponsService],
})
export class CouponsModule {}
