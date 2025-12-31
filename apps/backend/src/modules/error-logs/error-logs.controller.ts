import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorLogsService } from './error-logs.service';
import { CreateErrorLogDto } from './dto/create-error-log.dto';

@ApiTags('Error Logs')
@Controller('error-logs')
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Post()
  @ApiOperation({
    summary: '에러 로그 생성',
    description: 'Frontend에서 발생한 에러를 서버에 기록합니다. 에러 추적 및 디버깅에 사용됩니다.',
  })
  @ApiBody({
    type: CreateErrorLogDto,
    description: '에러 로그 데이터',
    examples: {
      networkError: {
        summary: '네트워크 에러 예시',
        value: {
          errorCode: 'NETWORK_ERROR',
          message: 'Failed to fetch menu data',
          severity: 'error',
          stackTrace: 'Error: Network request failed\n    at fetch (client.ts:45)',
          url: 'https://example.com/menu',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          storeId: '123e4567-e89b-12d3-a456-426614174000',
          metadata: {
            endpoint: '/api/v1/stores/123/menus',
            statusCode: 500,
          },
        },
      },
      validationError: {
        summary: '유효성 검증 에러 예시',
        value: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid order data',
          severity: 'warning',
          url: 'https://example.com/checkout',
          metadata: {
            field: 'tableNumber',
            value: null,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '에러 로그 생성 성공',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '에러 로그 생성 실패 (무한 루프 방지를 위해 에러를 throw하지 않음)',
    schema: {
      example: {
        success: false,
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (유효성 검증 실패)' })
  async create(@Body() dto: CreateErrorLogDto) {
    try {
      await this.errorLogsService.create(dto);
      return { success: true };
    } catch (error) {
      // 에러 로깅 실패는 무시 (무한 루프 방지)
      console.error('Failed to create error log:', error);
      return { success: false };
    }
  }
}
