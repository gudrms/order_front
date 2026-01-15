import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MenuSyncService } from './menu-sync.service';
// import { SupabaseGuard } from '../../auth/guards/supabase.guard'; // Auth Guard needed?

@ApiTags('Integrations')
@Controller('stores/:storeId/integrations/toss')
export class TossController {
    constructor(private readonly menuSyncService: MenuSyncService) { }

    @Post('sync-menu')
    // @UseGuards(SupabaseGuard) // TODO: Enable auth
    @ApiOperation({
        summary: 'Toss 메뉴 동기화',
        description: 'Toss Open API에서 메뉴 데이터를 가져와 DB에 동기화합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID (UUID)',
    })
    @ApiResponse({
        status: 201,
        description: '동기화 성공',
    })
    async syncMenu(@Param('storeId') storeId: string) {
        return this.menuSyncService.syncMenu(storeId);
    }

    @Post('test-connection')
    @ApiOperation({
        summary: 'Toss API 연결 테스트',
        description: '매장 정보 조회 API를 호출하여 키가 올바른지 확인합니다.',
    })
    async testConnection() {
        return this.menuSyncService.testConnection();
    }
}
