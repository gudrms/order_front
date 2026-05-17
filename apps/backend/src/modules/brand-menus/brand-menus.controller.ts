import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
