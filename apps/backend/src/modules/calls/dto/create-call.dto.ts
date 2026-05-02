import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCallDto {
    @ApiProperty({
        description: '직원 호출 유형',
        enum: ['WATER', 'TISSUE', 'CUTLERY', 'OTHER'],
        example: 'WATER',
    })
    @IsString()
    @IsIn(['WATER', 'TISSUE', 'CUTLERY', 'OTHER'])
    type: string;

    @ApiProperty({
        description: '추가 요청 메시지',
        required: false,
        example: '앞접시도 같이 부탁드립니다.',
    })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    message?: string;
}
