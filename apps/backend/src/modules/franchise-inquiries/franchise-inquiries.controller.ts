import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FranchiseInquiryStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CreateFranchiseInquiryDto, UpdateFranchiseInquiryDto } from './dto/franchise-inquiry.dto';
import { FranchiseInquiriesService } from './franchise-inquiries.service';

@ApiTags('Franchise Inquiries')
@Controller('franchise-inquiries')
export class FranchiseInquiriesController {
  constructor(private readonly inquiriesService: FranchiseInquiriesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Create franchise inquiry',
    description: 'Public endpoint used by the brand website franchise form.',
  })
  @ApiBody({ type: CreateFranchiseInquiryDto })
  create(@Body() dto: CreateFranchiseInquiryDto) {
    return this.inquiriesService.create(dto);
  }

  @Get()
  @UseGuards(SupabaseGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List franchise inquiries',
    description: 'Platform admin only. Returns newest inquiries first.',
  })
  @ApiQuery({ name: 'status', enum: FranchiseInquiryStatus, required: false })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('status') status?: FranchiseInquiryStatus,
  ) {
    return this.inquiriesService.findAll(user.id, status);
  }

  @Patch(':inquiryId')
  @UseGuards(SupabaseGuard)
  @ApiBearerAuth('JWT-auth')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Update franchise inquiry',
    description: 'Platform admin only. Updates status and internal note.',
  })
  @ApiBody({ type: UpdateFranchiseInquiryDto })
  update(
    @CurrentUser() user: { id: string },
    @Param('inquiryId') inquiryId: string,
    @Body() dto: UpdateFranchiseInquiryDto,
  ) {
    return this.inquiriesService.update(user.id, inquiryId, dto);
  }
}
