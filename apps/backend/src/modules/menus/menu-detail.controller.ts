import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MenusService } from './menus.service';

@ApiTags('Menus')
@Controller('menus')
export class MenuDetailController {
    constructor(private readonly menusService: MenusService) { }

    @Get(':menuId')
    @ApiOperation({
        summary: '메뉴 상세 정보 조회',
        description: '특정 메뉴의 상세 정보를 조회합니다. 메뉴 이름, 가격, 설명, 이미지, 옵션 등을 포함합니다.',
    })
    @ApiParam({
        name: 'menuId',
        description: '메뉴 ID',
        example: 'menu-1',
    })
    @ApiResponse({
        status: 200,
        description: '메뉴 상세 정보 조회 성공',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'menu-1',
                    name: '불고기 정식',
                    price: 12000,
                    description: '신선한 불고기와 각종 반찬이 포함된 푸짐한 정식',
                    imageUrl: 'https://example.com/bulgogi.jpg',
                    categoryId: 'cat-1',
                    categoryName: '메인 메뉴',
                    isAvailable: true,
                    preparationTime: 15,
                    options: [
                        {
                            id: 'opt-group-1',
                            name: '맵기 선택',
                            isRequired: true,
                            items: [
                                {
                                    id: 'opt-1',
                                    name: '순한맛',
                                    price: 0,
                                },
                                {
                                    id: 'opt-2',
                                    name: '중간맛',
                                    price: 0,
                                },
                                {
                                    id: 'opt-3',
                                    name: '매운맛',
                                    price: 0,
                                },
                            ],
                        },
                        {
                            id: 'opt-group-2',
                            name: '사이드 추가',
                            isRequired: false,
                            items: [
                                {
                                    id: 'opt-4',
                                    name: '계란후라이 추가',
                                    price: 1000,
                                },
                                {
                                    id: 'opt-5',
                                    name: '치즈 추가',
                                    price: 1500,
                                },
                            ],
                        },
                    ],
                    nutritionInfo: {
                        calories: 650,
                        protein: 35,
                        fat: 20,
                        carbs: 75,
                    },
                    allergyInfo: ['대두', '밀'],
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: '메뉴를 찾을 수 없습니다.' })
    async getMenuDetail(@Param('menuId') menuId: string) {
        return this.menusService.getMenuDetail(menuId);
    }
}
