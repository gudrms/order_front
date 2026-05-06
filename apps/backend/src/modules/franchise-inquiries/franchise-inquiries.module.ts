import { Module } from '@nestjs/common';
import { FranchiseInquiriesController } from './franchise-inquiries.controller';
import { FranchiseInquiriesService } from './franchise-inquiries.service';

@Module({
  controllers: [FranchiseInquiriesController],
  providers: [FranchiseInquiriesService],
})
export class FranchiseInquiriesModule {}
