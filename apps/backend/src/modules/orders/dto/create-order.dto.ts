import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemOptionDto {
    @IsString()
    @IsNotEmpty()
    optionId: string;
}

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    menuId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemOptionDto)
    options?: CreateOrderItemOptionDto[];
}

export class CreateOrderDto {
    @IsString()
    @IsOptional()
    tableId?: string; // 나중에 테이블 주문 연동 시 사용

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}
