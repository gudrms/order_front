import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get('identifier/:storeType/:branchId')
    async getStoreByPath(
        @Param('storeType') storeType: string,
        @Param('branchId') branchId: string,
    ) {
        const store = await this.storesService.getStoreByPath(storeType, branchId);
        if (!store) {
            throw new NotFoundException('Store not found');
        }
        return store;
    }

    @Get(':storeId')
    async getStore(@Param('storeId') storeId: string) {
        const store = await this.storesService.getStore(storeId);
        if (!store) {
            throw new NotFoundException('Store not found');
        }
        return store;
    }
}
