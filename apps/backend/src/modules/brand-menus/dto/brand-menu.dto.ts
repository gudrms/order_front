import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBrandMenuCategoryDto {
    @ApiProperty({ description: 'Brand menu category name', example: 'Tacos' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Display order', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    displayOrder?: number;

    @ApiPropertyOptional({ description: 'Visible on brand website', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateBrandMenuCategoryDto extends PartialType(CreateBrandMenuCategoryDto) {}

export class CreateBrandMenuDto {
    @ApiProperty({ description: 'Brand menu category ID' })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({ description: 'Menu name', example: 'Signature Taco' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Price', example: 9000 })
    @IsInt()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ description: 'Menu description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Supabase Storage public image URL' })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'Display order', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    displayOrder?: number;

    @ApiPropertyOptional({ description: 'Show in home featured menu section', default: false })
    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @ApiPropertyOptional({ description: 'Visible on brand website', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateBrandMenuDto extends PartialType(CreateBrandMenuDto) {}
