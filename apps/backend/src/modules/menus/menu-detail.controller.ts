import { Controller, Get, Param } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('menus')
export class MenuDetailController {
    constructor(private readonly menusService: MenusService) { }

    @Get(':menuId')
    async getMenuDetail(@Param('menuId') menuId: string) {
        return this.menusService.getMenuDetail(menuId);
    }
}
