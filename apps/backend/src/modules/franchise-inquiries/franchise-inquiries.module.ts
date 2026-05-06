import { Module } from '@nestjs/common';
import { FranchiseInquiriesController } from './franchise-inquiries.controller';
import { FranchiseInquiriesService } from './franchise-inquiries.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FranchiseInquiriesController],
    providers: [FranchiseInquiriesService],
    exports: [FranchiseInquiriesService],
})
export class FranchiseInquiriesModule {}
