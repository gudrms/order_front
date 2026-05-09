import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CompleteSessionDto } from './dto/complete-session.dto';

@ApiTags('Sessions')
@Controller('stores/:storeId')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('tables/:tableNumber/current-session')
  @ApiOperation({
    summary: '현재 테이블의 활성 세션 조회',
    description: '테이블 번호로 현재 활성화된 세션과 주문 내역을 조회합니다.',
  })
  @ApiParam({
    name: 'storeId',
    description: '매장 ID',
    example: 'store-1',
  })
  @ApiParam({
    name: 'tableNumber',
    description: '테이블 번호',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: '현재 세션 조회 성공 (세션이 없으면 null 반환)',
    schema: {
      example: {
        statusCode: 200,
        data: {
          id: 'cm9abc123def456ghi',
          sessionNumber: 'SES-20241231-001',
          tableNumber: 5,
          guestCount: 2,
          status: 'ACTIVE',
          totalAmount: 36000,
          startedAt: '2024-12-31T10:00:00.000Z',
          orders: [
            {
              id: 'cm9ord456ghi789jkl',
              orderNumber: 'ORD-20241231-001',
              totalAmount: 36000,
              items: [],
            },
          ],
        },
      },
    },
  })
  async getCurrentSession(
    @Param('storeId') storeId: string,
    @Param('tableNumber') tableNumber: string,
  ) {
    return this.sessionsService.getCurrentSession(storeId, parseInt(tableNumber));
  }

  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: '세션 상세 조회',
    description: '세션 ID로 세션 정보와 주문 내역을 조회합니다.',
  })
  @ApiParam({
    name: 'storeId',
    description: '매장 ID',
    example: 'store-1',
  })
  @ApiParam({
    name: 'sessionId',
    description: '세션 ID',
    example: 'cm9abc123def456ghi',
  })
  @ApiResponse({
    status: 200,
    description: '세션 조회 성공',
    schema: {
      example: {
        statusCode: 200,
        data: {
          id: 'cm9abc123def456ghi',
          sessionNumber: 'SES-20241231-001',
          tableNumber: 5,
          status: 'ACTIVE',
          totalAmount: 36000,
          startedAt: '2024-12-31T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '세션을 찾을 수 없습니다',
  })
  async getSession(
    @Param('storeId') storeId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.sessionsService.getSessionById(sessionId);
  }

  @Post('tables/:tableNumber/reset')
  @ApiOperation({
    summary: '테이블 세션 강제 종료 (테스트용)',
    description: '테스트를 위해 특정 테이블의 활성 세션을 강제로 종료합니다.',
  })
  @ApiParam({
    name: 'storeId',
    description: '매장 ID',
    example: 'store-1',
  })
  @ApiParam({
    name: 'tableNumber',
    description: '테이블 번호',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: '세션 강제 종료 성공 (활성 세션이 없으면 null 반환)',
    schema: {
      example: {
        statusCode: 200,
        data: {
          id: 'cm9abc123def456ghi',
          status: 'COMPLETED',
          endedAt: '2024-12-31T12:00:00.000Z',
        },
      },
    },
  })
  async resetTable(
    @Param('storeId') storeId: string,
    @Param('tableNumber') tableNumber: string,
  ) {
    const session = await this.sessionsService.getCurrentSession(
      storeId,
      parseInt(tableNumber),
    );

    if (!session) return null;

    // 강제 종료
    return this.sessionsService.completeSession(
      session.id,
      { guestCount: 1 }, // 기본값
    );
  }

  @Post('sessions/:sessionId/complete')
  @ApiOperation({
    summary: '세션 종료 (결제 완료)',
    description:
      '세션을 종료하고 결제를 완료합니다. 적립 고객인 경우 전화번호를 입력하면 포인트가 적립됩니다.',
  })
  @ApiParam({
    name: 'storeId',
    description: '매장 ID',
    example: 'store-1',
  })
  @ApiParam({
    name: 'sessionId',
    description: '세션 ID',
    example: 'cm9abc123def456ghi',
  })
  @ApiBody({
    type: CompleteSessionDto,
    examples: {
      withGuest: {
        summary: '적립 고객 (전화번호 입력)',
        value: {
          guestCount: 2,
          guestPhone: '010-1234-5678',
          guestName: '홍길동',
          paymentMethod: 'CARD',
        },
      },
      withoutGuest: {
        summary: '비적립 (전화번호 없음)',
        value: {
          guestCount: 2,
          paymentMethod: 'CASH',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '세션 종료 성공',
    schema: {
      example: {
        statusCode: 200,
        data: {
          id: 'cm9abc123def456ghi',
          sessionNumber: 'SES-20241231-001',
          status: 'COMPLETED',
          totalAmount: 36000,
          guestCount: 2,
          endedAt: '2024-12-31T12:00:00.000Z',
          guest: {
            id: 'guest-789',
            phoneNumber: '010-1234-5678',
            name: '홍길동',
            visitCount: 3,
            totalSpent: 150000,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '세션을 찾을 수 없습니다',
  })
  async completeSession(
    @Param('storeId') storeId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.sessionsService.completeSession(sessionId, dto);
  }
}
