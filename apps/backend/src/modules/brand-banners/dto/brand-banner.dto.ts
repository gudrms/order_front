import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBrandBannerDto {
    @ApiProperty({ description: 'Banner title', example: '타코몰리에 오신 걸 환영해요' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Banner subtitle', example: '지금 주문하면 배달비 무료!' })
    @IsString()
    @IsOptional()
    subtitle?: string;

    @ApiPropertyOptional({ description: 'Banner badge', example: '기간 한정' })
    @IsString()
    @IsOptional()
    badge?: string;

    @ApiProperty({ description: 'Background type', enum: ['GRADIENT', 'IMAGE'], example: 'GRADIENT' })
    @IsString()
    @IsIn(['GRADIENT', 'IMAGE'])
    bgType: string;

    @ApiPropertyOptional({ description: 'Gradient start HEX color', example: '#FFC72C' })
    @IsString()
    @IsOptional()
    bgStartColor?: string;

    @ApiPropertyOptional({ description: 'Gradient end HEX color', example: '#FF8F00' })
    @IsString()
    @IsOptional()
    bgEndColor?: string;

    @ApiPropertyOptional({ description: 'Public image URL from Supabase Storage' })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({ description: 'Click action link type', enum: ['NONE', 'STORE', 'EXTERNAL'], example: 'NONE' })
    @IsString()
    @IsIn(['NONE', 'STORE', 'EXTERNAL'])
    linkType: string;

    @ApiPropertyOptional({ description: 'External/internal target link URL', example: 'https://...' })
    @IsString()
    @IsOptional()
    linkUrl?: string;

    @ApiPropertyOptional({ description: 'Target store ID for quick store linking' })
    @IsString()
    @IsOptional()
    storeId?: string;

    @ApiPropertyOptional({ description: 'Display order', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    displayOrder?: number;

    @ApiPropertyOptional({ description: 'Banner active status', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateBrandBannerDto extends PartialType(CreateBrandBannerDto) {}
