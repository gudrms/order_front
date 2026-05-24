import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { BrandBannersService } from './brand-banners.service';
import { CreateBrandBannerDto, UpdateBrandBannerDto } from './dto/brand-banner.dto';

@ApiTags('Brand Banners')
@Controller('brand-banners')
export class BrandBannersController {
    constructor(private readonly brandBannersService: BrandBannersService) {}

    @Get()
    @ApiOperation({ summary: 'List active brand banners for the delivery app main screen' })
    getPublicBanners() {
        return this.brandBannersService.getPublicBanners();
    }

    @Get('admin')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'List all brand banners for platform admins' })
    getAdminBanners(@CurrentUser() user: { id: string }) {
        return this.brandBannersService.getAdminBanners(user.id);
    }

    @Post('admin')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiBody({ type: CreateBrandBannerDto })
    createBanner(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateBrandBannerDto,
    ) {
        return this.brandBannersService.createBanner(user.id, dto);
    }

    @Patch('admin/:bannerId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiBody({ type: UpdateBrandBannerDto })
    updateBanner(
        @CurrentUser() user: { id: string },
        @Param('bannerId') bannerId: string,
        @Body() dto: UpdateBrandBannerDto,
    ) {
        return this.brandBannersService.updateBanner(user.id, bannerId, dto);
    }

    @Delete('admin/:bannerId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    deleteBanner(
        @CurrentUser() user: { id: string },
        @Param('bannerId') bannerId: string,
    ) {
        return this.brandBannersService.deleteBanner(user.id, bannerId);
    }

    @Post('admin/image')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: '브랜드 배너 이미지 업로드', description: '배너 이미지를 Supabase Storage에 업로드하고 public URL을 반환합니다.' })
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @ApiResponse({ status: 201, description: '이미지 업로드 성공', schema: { example: { imageUrl: 'https://.../assets/brand-banner/uuid.jpg' } } })
    uploadBannerImage(
        @CurrentUser() user: { id: string },
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.brandBannersService.uploadBannerImage(user.id, file);
    }
}
