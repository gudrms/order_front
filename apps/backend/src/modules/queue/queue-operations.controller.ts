import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { QueueOperationsService } from './queue-operations.service';

@ApiTags('Queue Operations')
@Controller('stores/:storeId/operations')
export class QueueOperationsController {
    constructor(private readonly queueOperationsService: QueueOperationsService) { }

    @Get('notifications/failed')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '알림 발송 실패 목록',
        description: '관리자 운영 화면에서 확인할 수 있는 알림 발송 실패 로그를 조회합니다.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
    @ApiResponse({ status: 200, description: '알림 실패 목록 조회 성공' })
    async getNotificationFailures(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Query('page') page: number = 1,
    ) {
        return this.queueOperationsService.getNotificationFailures(user.id, storeId, Number(page) || 1);
    }

    @Patch('notifications/:notificationId/retry')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '알림 발송 수동 재시도',
        description: '실패한 알림 로그를 PENDING으로 되돌리고 notification.send 큐 작업을 다시 발행합니다.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'notificationId', description: 'NotificationLog ID' })
    @ApiResponse({ status: 200, description: '알림 재시도 등록 성공' })
    async retryNotification(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('notificationId') notificationId: string,
    ) {
        return this.queueOperationsService.retryNotification(user.id, storeId, notificationId);
    }
}
