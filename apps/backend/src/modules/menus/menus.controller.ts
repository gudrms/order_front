import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import {
    CreateMenuCategoryDto,
    CreateMenuDto,
    CreateMenuOptionDto,
    CreateOptionGroupDto,
    UpdateMenuDto,
    UpdateMenuOptionDto,
    UpdateOptionGroupDto,
} from './dto/menu-admin.dto';
import { MenusService } from './menus.service';

@ApiTags('Menus')
@Controller('stores/:storeId')
export class MenusController {
    constructor(private readonly menusService: MenusService) { }

    @Get('categories')
    @ApiOperation({
        summary: '카테고리 목록 조회',
        description: '특정 매장의 모든 메뉴 카테고리를 조회합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: '카테고리 목록 조회 성공',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    { id: 'cat-uuid-1', name: '타코류', displayOrder: 1 },
                    { id: 'cat-uuid-2', name: '음료', displayOrder: 2 },
                ],
            },
        },
    })
    @ApiResponse({ status: 404, description: '매장을 찾을 수 없습니다.' })
    async getCategories(@Param('storeId') storeId: string) {
        return this.menusService.getCategories(storeId);
    }

    @Post('categories')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '카테고리 생성', description: '매장 관리자가 새 메뉴 카테고리를 추가합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID (UUID)' })
    @ApiBody({ type: CreateMenuCategoryDto })
    @ApiResponse({ status: 201, description: '카테고리 생성 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async createCategory(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Body() dto: CreateMenuCategoryDto,
    ) {
        return this.menusService.createCategory(user.id, storeId, dto);
    }

    @Get('menus')
    @ApiOperation({
        summary: '메뉴 목록 조회',
        description: '특정 매장의 메뉴를 조회합니다. 카테고리 ID를 지정하면 해당 카테고리의 메뉴만 조회합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({
        name: 'categoryId',
        required: false,
        description: '카테고리 ID (선택사항)',
        example: 'cat-1',
    })
    @ApiResponse({
        status: 200,
        description: '메뉴 목록 조회 성공',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    {
                        id: 'menu-uuid-1',
                        name: '비프 타코',
                        price: 9500,
                        description: '부드러운 소고기와 신선한 채소',
                        imageUrl: 'https://cdn.tacomole.kr/menus/beef-taco.jpg',
                        categoryId: 'cat-uuid-1',
                        isAvailable: true,
                        soldOut: false,
                        optionGroups: [
                            {
                                id: 'og-uuid-1',
                                name: '맵기 선택',
                                isRequired: true,
                                options: [
                                    { id: 'opt-uuid-1', name: '순한맛', price: 0 },
                                    { id: 'opt-uuid-2', name: '매운맛', price: 0 },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    })
    @ApiResponse({ status: 404, description: '매장을 찾을 수 없습니다.' })
    async getMenus(
        @Param('storeId') storeId: string,
        @Query('categoryId') categoryId?: string,
    ) {
        return this.menusService.getMenus(storeId, categoryId);
    }

    @Get('admin/menus')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: '관리자 메뉴 목록 조회', description: '관리자용 메뉴 목록을 조회합니다. 숨김/품절 포함.' })
    @ApiParam({ name: 'storeId', description: '매장 ID (UUID)' })
    @ApiQuery({ name: 'categoryId', required: false, description: '카테고리 ID' })
    @ApiResponse({ status: 200, description: '메뉴 목록 조회 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async getAdminMenus(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Query('categoryId') categoryId?: string,
    ) {
        return this.menusService.getAdminMenus(user.id, storeId, categoryId);
    }

    @Post('menus')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '메뉴 생성', description: '매장 관리자가 새 메뉴를 등록합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID (UUID)' })
    @ApiBody({ type: CreateMenuDto })
    @ApiResponse({ status: 201, description: '메뉴 생성 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async createMenu(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Body() dto: CreateMenuDto,
    ) {
        return this.menusService.createMenu(user.id, storeId, dto);
    }

    @Post('menus/image')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: '메뉴 이미지 업로드', description: '메뉴 이미지를 Supabase Storage에 업로드하고 public URL을 반환합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID (UUID)' })
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @ApiResponse({ status: 201, description: '이미지 업로드 성공', schema: { example: { imageUrl: 'https://.../assets/menu/store-id/uuid.jpg' } } })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async uploadMenuImage(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.menusService.uploadMenuImage(user.id, storeId, file);
    }

    @Patch('menus/:menuId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '메뉴 수정', description: '매장 관리자가 메뉴 정보를 수정합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID (UUID)' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiBody({ type: UpdateMenuDto })
    @ApiResponse({ status: 200, description: '메뉴 수정 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '메뉴를 찾을 수 없음' })
    async updateMenu(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('menuId') menuId: string,
        @Body() dto: UpdateMenuDto,
    ) {
        return this.menusService.updateMenu(user.id, storeId, menuId, dto);
    }

    @Post('menus/:menuId/option-groups')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '옵션 그룹 생성', description: '메뉴에 옵션 그룹(예: 맵기 선택)을 추가합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiResponse({ status: 201, description: '옵션 그룹 생성 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async createOptionGroup(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('menuId') menuId: string,
        @Body() dto: CreateOptionGroupDto,
    ) {
        return this.menusService.createOptionGroup(user.id, storeId, menuId, dto);
    }

    @Patch('menus/:menuId/option-groups/:groupId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '옵션 그룹 수정', description: '옵션 그룹 이름이나 필수 여부를 수정합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiParam({ name: 'groupId', description: '옵션 그룹 ID' })
    @ApiResponse({ status: 200, description: '옵션 그룹 수정 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async updateOptionGroup(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('menuId') menuId: string,
        @Param('groupId') groupId: string,
        @Body() dto: UpdateOptionGroupDto,
    ) {
        return this.menusService.updateOptionGroup(user.id, storeId, menuId, groupId, dto);
    }

    @Delete('menus/:menuId/option-groups/:groupId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(204)
    @ApiOperation({ summary: '옵션 그룹 삭제', description: '옵션 그룹과 하위 옵션을 모두 삭제합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiParam({ name: 'groupId', description: '옵션 그룹 ID' })
    @ApiResponse({ status: 204, description: '옵션 그룹 삭제 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async deleteOptionGroup(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('menuId') menuId: string,
        @Param('groupId') groupId: string,
    ) {
        return this.menusService.deleteOptionGroup(user.id, storeId, menuId, groupId);
    }

    @Post('menus/:menuId/option-groups/:groupId/options')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '옵션 항목 생성', description: '옵션 그룹에 선택 항목(예: 순한맛)을 추가합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiParam({ name: 'groupId', description: '옵션 그룹 ID' })
    @ApiResponse({ status: 201, description: '옵션 항목 생성 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async createOption(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('menuId') menuId: string,
        @Param('groupId') groupId: string,
        @Body() dto: CreateMenuOptionDto,
    ) {
        return this.menusService.createOption(user.id, storeId, menuId, groupId, dto);
    }

    @Patch('menus/:menuId/option-groups/:groupId/options/:optionId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '옵션 항목 수정', description: '옵션 항목의 이름, 가격, 품절 여부를 수정합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiParam({ name: 'groupId', description: '옵션 그룹 ID' })
    @ApiParam({ name: 'optionId', description: '옵션 항목 ID' })
    @ApiResponse({ status: 200, description: '옵션 항목 수정 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async updateOption(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('menuId') menuId: string,
        @Param('groupId') groupId: string,
        @Param('optionId') optionId: string,
        @Body() dto: UpdateMenuOptionDto,
    ) {
        return this.menusService.updateOption(user.id, storeId, menuId, groupId, optionId, dto);
    }

    @Delete('menus/:menuId/option-groups/:groupId/options/:optionId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(204)
    @ApiOperation({ summary: '옵션 항목 삭제', description: '옵션 그룹에서 선택 항목을 삭제합니다.' })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiParam({ name: 'groupId', description: '옵션 그룹 ID' })
    @ApiParam({ name: 'optionId', description: '옵션 항목 ID' })
    @ApiResponse({ status: 204, description: '옵션 항목 삭제 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async deleteOption(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('menuId') menuId: string,
        @Param('groupId') groupId: string,
        @Param('optionId') optionId: string,
    ) {
        return this.menusService.deleteOption(user.id, storeId, menuId, groupId, optionId);
    }
}
