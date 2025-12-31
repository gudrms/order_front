import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { StoresService } from './stores.service';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get('identifier/:storeType/:branchId')
    @ApiOperation({
        summary: '매장 경로로 조회',
        description: '매장 타입(storeType)과 지점 ID(branchId)를 사용하여 매장 정보를 조회합니다. URL 경로 기반 라우팅에 사용됩니다.',
    })
    @ApiParam({
        name: 'storeType',
        description: '매장 타입 (예: tacomolly, burgerking)',
        example: 'tacomolly',
    })
    @ApiParam({
        name: 'branchId',
        description: '지점 ID (예: gimpo, gangnam)',
        example: 'gimpo',
    })
    @ApiResponse({
        status: 200,
        description: '매장 정보 조회 성공',
        schema: {
            example: {
                success: true,
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: '타코몰리 김포점',
                    storeType: 'tacomolly',
                    branchId: 'gimpo',
                    address: '경기도 김포시 ...',
                    phoneNumber: '031-123-4567',
                    businessHours: {
                        open: '11:00',
                        close: '22:00',
                    },
                    isOpen: true,
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: '매장을 찾을 수 없습니다.' })
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
    @ApiOperation({
        summary: '매장 ID로 조회',
        description: '매장 UUID를 사용하여 특정 매장의 상세 정보를 조회합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: '매장 정보 조회 성공',
        schema: {
            example: {
                success: true,
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: '타코몰리 김포점',
                    storeType: 'tacomolly',
                    branchId: 'gimpo',
                    address: '경기도 김포시 ...',
                    phoneNumber: '031-123-4567',
                    businessHours: {
                        open: '11:00',
                        close: '22:00',
                    },
                    isOpen: true,
                    tableCount: 20,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: '매장을 찾을 수 없습니다.' })
    async getStore(@Param('storeId') storeId: string) {
        const store = await this.storesService.getStore(storeId);
        if (!store) {
            throw new NotFoundException('Store not found');
        }
        return store;
    }
}
