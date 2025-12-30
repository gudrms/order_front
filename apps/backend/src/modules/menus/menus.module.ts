import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenuDetailController } from './menu-detail.controller';
import { MenusService } from './menus.service';

@Module({
    controllers: [MenusController, MenuDetailController],
    providers: [MenusService],
})
export class MenusModule { }
