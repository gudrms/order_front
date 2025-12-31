import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
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
                success: true,
                data: [
                    {
                        id: 'cat-1',
                        name: '메인 메뉴',
                        displayOrder: 1,
                    },
                    {
                        id: 'cat-2',
                        name: '사이드 메뉴',
                        displayOrder: 2,
                    },
                ],
            },
        },
    })
    @ApiResponse({ status: 404, description: '매장을 찾을 수 없습니다.' })
    async getCategories(@Param('storeId') storeId: string) {
        return this.menusService.getCategories(storeId);
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
                success: true,
                data: [
                    {
                        id: 'menu-1',
                        name: '불고기 정식',
                        price: 12000,
                        description: '신선한 불고기와 각종 반찬',
                        imageUrl: 'https://example.com/bulgogi.jpg',
                        categoryId: 'cat-1',
                        isAvailable: true,
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
}
