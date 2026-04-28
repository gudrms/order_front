import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
    @ApiProperty({
        description: '고객이 입력한 주문 취소 사유',
        example: '주문을 잘못 선택했습니다.',
        required: false,
        maxLength: 200,
    })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    reason?: string;
}
