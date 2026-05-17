import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrandMenusController } from './brand-menus.controller';
import { BrandMenusService } from './brand-menus.service';

@Module({
    imports: [PrismaModule],
    controllers: [BrandMenusController],
    providers: [BrandMenusService],
})
export class BrandMenusModule {}
