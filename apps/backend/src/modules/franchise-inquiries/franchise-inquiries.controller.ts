import {
    Body, Controller, Get, Param, Patch,
    Post, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {
    ApiBearerAuth, ApiBody, ApiOperation,
    ApiParam, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { FranchiseInquiriesService } from './franchise-inquiries.service';
import { CreateFranchiseInquiryDto } from './dto/create-franchise-inquiry.dto';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Franchise')
@Controller('franchise-inquiries')
export class FranchiseInquiriesController {
    constructor(private readonly service: FranchiseInquiriesService) {}

    // ────────────────────────────────────────────
    // 공개 (홈페이지 폼 제출)
    // ────────────────────────────────────────────

    @Post()
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: '창업 문의 접수',
        description: '홈페이지 가맹 상담 신청 폼에서 호출. 인증 불필요.',
    })
    @ApiBody({ type: CreateFranchiseInquiryDto })
    @ApiResponse({ status: 201, description: '접수 완료' })
    @ApiResponse({ status: 400, description: '유효성 검증 실패' })
    async create(@Body() dto: CreateFranchiseInquiryDto) {
        return this.service.create(dto);
    }

    // ────────────────────────────────────────────
    // 관리자 전용 (인증 필요)
    // ────────────────────────────────────────────

    @Get()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '창업 문의 목록 (관리자)',
        description: '모든 창업 문의를 최신순으로 반환합니다.',
    })
    @ApiResponse({ status: 200, description: '문의 목록' })
    async findAll(@CurrentUser() user: { id: string }) {
        return this.service.findAll(user.id);
    }

    @Get('unread-count')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: '읽지 않은 창업 문의 수 (관리자)' })
    async countUnread(@CurrentUser() user: { id: string }) {
        const count = await this.service.countUnread(user.id);
        return { count };
    }

    @Patch(':id/read')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '창업 문의 읽음 처리 (관리자)',
        description: '해당 문의의 isRead를 true로 변경합니다.',
    })
    @ApiParam({ name: 'id', description: '문의 ID' })
    @ApiResponse({ status: 200, description: '읽음 처리 완료' })
    async markAsRead(
        @CurrentUser() user: { id: string },
        @Param('id') id: string,
    ) {
        return this.service.markAsRead(user.id, id);
    }
}
