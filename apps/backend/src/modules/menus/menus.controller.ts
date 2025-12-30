import { Controller, Get, Param, Query } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('stores/:storeId')
export class MenusController {
    constructor(private readonly menusService: MenusService) { }

    @Get('categories')
    async getCategories(@Param('storeId') storeId: string) {
        return this.menusService.getCategories(storeId);
    }

    @Get('menus')
    async getMenus(
        @Param('storeId') storeId: string,
        @Query('categoryId') categoryId?: string,
    ) {
        return this.menusService.getMenus(storeId, categoryId);
    }
}
