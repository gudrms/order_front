import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 세션 종료 (결제 완료) DTO
 */
export class CompleteSessionDto {
  @ApiProperty({
    description: '실제 손님 수',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  guestCount: number;

  @ApiProperty({
    description: '적립 고객 전화번호 (선택)',
    example: '010-1234-5678',
    required: false,
  })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @ApiProperty({
    description: '손님 이름 (선택)',
    example: '홍길동',
    required: false,
  })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiProperty({
    description: '결제 방법 (선택)',
    example: 'CARD',
    enum: ['CARD', 'CASH', 'MOBILE'],
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: 'CARD' | 'CASH' | 'MOBILE';
}
