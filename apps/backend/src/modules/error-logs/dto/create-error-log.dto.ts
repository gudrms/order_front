/**
 * Frontend에서 에러 로그를 생성하는 DTO
 */

import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { ErrorSeverity } from '@order/shared';

export class CreateErrorLogDto {
  @ApiProperty({
    description: '에러 코드',
    example: 'NETWORK_ERROR',
    type: String,
  })
  @IsString()
  errorCode: string;

  @ApiProperty({
    description: '에러 메시지',
    example: 'Failed to fetch data from server',
    type: String,
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: '에러 심각도',
    enum: ['info', 'warning', 'error', 'critical'],
    example: 'error',
  })
  @IsEnum(['info', 'warning', 'error', 'critical'])
  severity: ErrorSeverity;

  @ApiProperty({
    description: '에러 스택 트레이스 (선택사항)',
    required: false,
    example: 'Error: Network request failed\n    at fetch (client.ts:45)',
    type: String,
  })
  @IsOptional()
  @IsString()
  stackTrace?: string;

  @ApiProperty({
    description: '에러 발생 URL (선택사항)',
    required: false,
    example: 'https://example.com/menu',
    type: String,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: '사용자 브라우저 정보 (선택사항)',
    required: false,
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    type: String,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: '매장 ID (선택사항)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({
    description: '추가 메타데이터 (선택사항)',
    required: false,
    example: { userId: 'user-123', action: 'checkout' },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
