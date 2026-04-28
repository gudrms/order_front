import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum DeliveryStatusDto {
    PENDING = 'PENDING',
    ASSIGNED = 'ASSIGNED',
    PICKED_UP = 'PICKED_UP',
    DELIVERING = 'DELIVERING',
    DELIVERED = 'DELIVERED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

export class UpdateDeliveryStatusDto {
    @ApiProperty({
        description: '변경할 배달 상태',
        enum: DeliveryStatusDto,
        example: DeliveryStatusDto.DELIVERING,
    })
    @IsEnum(DeliveryStatusDto)
    status: DeliveryStatusDto;

    @ApiProperty({
        description: '라이더 또는 매장 운영 메모',
        example: '공동현관 앞 도착 예정',
        required: false,
        maxLength: 200,
    })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    riderMemo?: string;
}
