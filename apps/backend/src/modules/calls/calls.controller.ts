import { Body, Controller, Param, ParseIntPipe, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';

@ApiTags('Calls')
@Controller('stores/:storeId/tables/:tableNumber/calls')
export class CallsController {
    constructor(private readonly callsService: CallsService) { }

    @Post()
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
