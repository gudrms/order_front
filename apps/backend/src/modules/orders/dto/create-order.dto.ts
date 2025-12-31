import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemOptionDto {
    @ApiProperty({
        description: '옵션 ID',
        example: 'opt-1',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    optionId: string;
}

export class CreateOrderItemDto {
    @ApiProperty({
        description: '메뉴 ID',
        example: 'menu-1',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    menuId: string;

    @ApiProperty({
        description: '주문 수량 (1 이상)',
        example: 2,
        minimum: 1,
        type: Number,
    })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiProperty({
        description: '선택된 옵션 목록 (선택사항)',
        type: [CreateOrderItemOptionDto],
        required: false,
        example: [
            { optionId: 'opt-1' },
            { optionId: 'opt-2' },
        ],
    })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemOptionDto)
    options?: CreateOrderItemOptionDto[];
}

export class CreateOrderDto {
    @ApiProperty({
        description: '테이블 번호',
        example: 5,
        type: Number,
    })
    @IsInt()
    @IsNotEmpty()
    tableNumber: number;

    @ApiProperty({
        description: '주문 항목 목록',
        type: [CreateOrderItemDto],
        example: [
            {
                menuId: 'menu-1',
                quantity: 2,
                options: [{ optionId: 'opt-1' }],
            },
            {
                menuId: 'menu-2',
                quantity: 1,
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}
