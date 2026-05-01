import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCouponDto {
    @ApiProperty({ description: '쿠폰 이름', example: '신규 가입 쿠폰' })
    @IsString() @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: '쿠폰 설명' })
    @IsOptional() @IsString()
    description?: string;

    @ApiPropertyOptional({ description: '프로모 코드 (null이면 자동 지급 전용)', example: 'WELCOME2026' })
    @IsOptional() @IsString()
    code?: string;

    @ApiProperty({ enum: CouponType, description: 'PERCENTAGE | FIXED_AMOUNT' })
    @IsEnum(CouponType)
    type: CouponType;

    @ApiProperty({ description: '할인값 (PERCENTAGE: 1~100, FIXED_AMOUNT: 원)', example: 10 })
    @IsInt() @Min(1)
    discountValue: number;

    @ApiPropertyOptional({ description: '정률 할인 상한액 (원, 기본 5000)', example: 5000 })
    @IsOptional() @IsInt() @Min(0)
    maxDiscountAmount?: number;

    @ApiPropertyOptional({ description: '최소 주문금액 (원)', example: 15000 })
    @IsOptional() @IsInt() @Min(0)
    minOrderAmount?: number;

    @ApiPropertyOptional({ description: '총 발급 한도 (null = 무제한)', example: 100 })
    @IsOptional() @IsInt() @Min(1)
    maxUses?: number;

    @ApiPropertyOptional({ description: '만료일 기준 (일 수, 기본 30)', example: 30 })
    @IsOptional() @IsInt() @Min(1) @Max(365)
    defaultExpiryDays?: number;
}

export class RedeemCouponDto {
    @ApiProperty({ description: '프로모 코드', example: 'WELCOME2026' })
    @IsString() @IsNotEmpty()
    code: string;
}

export class IssueCouponDto {
    @ApiProperty({ description: '발급할 사용자 ID' })
    @IsString() @IsNotEmpty()
    userId: string;

    @ApiPropertyOptional({ description: '만료일 (기본: 쿠폰 defaultExpiryDays 적용)' })
    @IsOptional() @IsInt() @Min(1)
    expiryDays?: number;
}
