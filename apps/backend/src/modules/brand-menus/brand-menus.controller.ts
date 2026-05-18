import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { BrandMenusService } from './brand-menus.service';
import {
    CreateBrandMenuCategoryDto,
    CreateBrandMenuDto,
    UpdateBrandMenuCategoryDto,
    UpdateBrandMenuDto,
} from './dto/brand-menu.dto';

@ApiTags('Brand Menus')
@Controller('brand-menus')
export class BrandMenusController {
    constructor(private readonly brandMenusService: BrandMenusService) {}

    @Get('categories')
    @ApiOperation({ summary: 'List active brand menu categories for brand website' })
    getPublicCategories() {
        return this.brandMenusService.getPublicCategories();
    }

    @Get()
    @ApiOperation({ summary: 'List active brand menus for brand website' })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'featured', required: false, enum: ['true', 'false'] })
    getPublicMenus(
        @Query('categoryId') categoryId?: string,
        @Query('featured') featured?: string,
    ) {
        const featuredFilter = featured === undefined ? undefined : featured === 'true';
        return this.brandMenusService.getPublicMenus(categoryId, featuredFilter);
    }

    @Get('admin/categories')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'List all brand menu categories for platform admins' })
    getAdminCategories(@CurrentUser() user: { id: string }) {
        return this.brandMenusService.getAdminCategories(user.id);
    }

    @Post('admin/categories')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiBody({ type: CreateBrandMenuCategoryDto })
    createCategory(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateBrandMenuCategoryDto,
    ) {
        return this.brandMenusService.createCategory(user.id, dto);
    }

    @Patch('admin/categories/:categoryId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiBody({ type: UpdateBrandMenuCategoryDto })
    updateCategory(
        @CurrentUser() user: { id: string },
        @Param('categoryId') categoryId: string,
        @Body() dto: UpdateBrandMenuCategoryDto,
    ) {
        return this.brandMenusService.updateCategory(user.id, categoryId, dto);
    }

    @Post('admin/menus/image')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: '브랜드 메뉴 이미지 업로드', description: '브랜드 메뉴 이미지를 Supabase Storage에 업로드하고 public URL을 반환합니다.' })
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @ApiResponse({ status: 201, description: '이미지 업로드 성공', schema: { example: { imageUrl: 'https://.../assets/brand-menu/uuid.jpg' } } })
    uploadMenuImage(
        @CurrentUser() user: { id: string },
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.brandMenusService.uploadMenuImage(user.id, file);
    }

    @Post('admin/menus')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiBody({ type: CreateBrandMenuDto })
    createMenu(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateBrandMenuDto,
    ) {
        return this.brandMenusService.createMenu(user.id, dto);
    }

    @Patch('admin/menus/:menuId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiBody({ type: UpdateBrandMenuDto })
    updateMenu(
        @CurrentUser() user: { id: string },
        @Param('menuId') menuId: string,
        @Body() dto: UpdateBrandMenuDto,
    ) {
        return this.brandMenusService.updateMenu(user.id, menuId, dto);
    }

    @Delete('admin/menus/:menuId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    deleteMenu(
        @CurrentUser() user: { id: string },
        @Param('menuId') menuId: string,
    ) {
        return this.brandMenusService.deleteMenu(user.id, menuId);
    }
}
