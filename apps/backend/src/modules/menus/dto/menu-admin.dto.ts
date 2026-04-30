import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateMenuCategoryDto {
    @ApiProperty({ description: 'Category name', example: 'Main menu' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Display order', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    displayOrder?: number;
}

export class CreateMenuDto {
    @ApiProperty({ description: 'Category ID' })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({ description: 'Menu name', example: 'Taco set' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Price', example: 12000 })
    @IsInt()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ description: 'Menu description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Image URL' })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'Display order', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    displayOrder?: number;

    @ApiPropertyOptional({ description: 'Sold out', default: false })
    @IsBoolean()
    @IsOptional()
    soldOut?: boolean;

    @ApiPropertyOptional({ description: 'Hidden from customers', default: false })
    @IsBoolean()
    @IsOptional()
    isHidden?: boolean;
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
