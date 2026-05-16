import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenuDetailController } from './menu-detail.controller';
import { MenusService } from './menus.service';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [StorageModule],
    controllers: [MenusController, MenuDetailController],
    providers: [MenusService],
})
export class MenusModule { }
