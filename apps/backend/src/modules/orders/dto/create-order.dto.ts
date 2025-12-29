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
    @IsInt()
    @IsNotEmpty()
    tableNumber: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}
