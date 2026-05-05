import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';

@ApiTags('Calls')
@Controller()
export class CallsController {
    constructor(private readonly callsService: CallsService) { }

    // ──────────────────────────────────────────
    // 관리자 전용 (인증 필요)
    // ──────────────────────────────────────────

    @Get('stores/:storeId/calls')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '직원 호출 목록 조회 (관리자)',
        description: 'PENDING/PROCESSING 상태의 호출 목록을 반환합니다. 매장 소유자 또는 어드민만 조회 가능.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiResponse({ status: 200, description: '호출 목록' })
    async getPendingCalls(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
    ) {
        return this.callsService.getPendingCalls(user.id, storeId);
    }

    @Patch('stores/:storeId/calls/:callId/complete')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '직원 호출 완료 처리 (관리자)',
        description: '호출 상태를 COMPLETED로 변경합니다.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'callId', description: '호출 ID' })
    async completeCall(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('callId') callId: string,
    ) {
        return this.callsService.completeCall(user.id, storeId, callId);
    }

    // ──────────────────────────────────────────
    // 테이블오더용 (인증 없음, 테이블 유효성만 검증)
    // ──────────────────────────────────────────

    @Post('stores/:storeId/tables/:tableNumber/calls')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: '테이블 직원 호출 생성',
        description: '테이블오더에서 물/티슈/수저/기타 직원 호출을 생성합니다. 고객 단말에서 호출하므로 인증 없이 매장과 테이블 유효성만 검증합니다.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'tableNumber', description: '테이블 번호', example: 5 })
    @ApiBody({ type: CreateCallDto })
    @ApiResponse({ status: 201, description: '직원 호출 생성 성공' })
    @ApiResponse({ status: 400, description: '예약 테이블 또는 잘못된 호출 유형' })
    @ApiResponse({ status: 404, description: '매장 또는 테이블 없음' })
    async createCall(
        @Param('storeId') storeId: string,
        @Param('tableNumber', ParseIntPipe) tableNumber: number,
        @Body() dto: CreateCallDto,
    ) {
        return this.callsService.createCall(storeId, tableNumber, dto);
    }
}
