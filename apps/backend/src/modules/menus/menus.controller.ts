import { Controller, Get, Param } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('stores/:storeId/menus')
export class MenusController {
    constructor(private readonly menusService: MenusService) { }

    @Get()
    async getMenus(@Param('storeId') storeId: string) {
        return this.menusService.getMenus(storeId);
    }
}
