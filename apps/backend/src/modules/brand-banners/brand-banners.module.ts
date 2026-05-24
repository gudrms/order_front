import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { BrandBannersController } from './brand-banners.controller';
import { BrandBannersService } from './brand-banners.service';

@Module({
    imports: [PrismaModule, StorageModule],
    controllers: [BrandBannersController],
    providers: [BrandBannersService],
    exports: [BrandBannersService],
})
export class BrandBannersModule {}
