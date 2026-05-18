import { Body, Controller, Get, Param, NotFoundException, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CreateStoreDto, CreateTablesDto, UpdateStoreDto } from './dto/store-admin.dto';
import { StoresService } from './stores.service';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Post()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: '매장 생성',
        description: '관리자가 새 매장을 만듭니다. 점주 계정 연결은 ADMIN 전용 계정 관리 API에서 처리합니다.',
    })
    @ApiBody({ type: CreateStoreDto })
    @ApiResponse({
        status: 201,
        description: '매장 생성 성공',
        schema: {
            example: {
                statusCode: 201,
                data: {
                    id: 'cm9abc123def456ghi',
                    name: '타코몰리 김포점',
                    storeType: 'tacomolly',
                    branchId: 'gimpo',
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async createStore(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateStoreDto,
    ) {
        return this.storesService.createStore(user.id, dto);
    }

    @Get()
    @ApiOperation({
        summary: '활성 매장 목록 조회 (공개)',
        description: '브랜드 홈페이지 등 공개용. 활성화된 매장 목록을 반환합니다. 인증 불필요.',
    })
    @ApiResponse({
        status: 200,
        description: '활성 매장 목록',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    {
                        id: 'cm9abc123def456ghi',
                        name: '타코몰리 김포점',
                        storeType: 'tacomolly',
                        branchId: 'gimpo',
                        address: '경기도 김포시 장기동 123',
                        phoneNumber: '031-123-4567',
                        isActive: true,
                        isDeliveryEnabled: true,
                    },
                ],
            },
        },
    })
    async getActiveStores() {
        return this.storesService.getActiveStores();
    }

    @Get('me')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '내 매장 목록 조회',
        description: '현재 로그인한 사장님이 소유한 매장 목록을 조회합니다.',
    })
    async getMyStores(@CurrentUser() user: { id: string }) {
        return this.storesService.getMyStores(user.id);
    }

    @Get('identifier/:storeType/:branchId')
    @ApiOperation({
        summary: '매장 경로로 조회',
        description: '공개 URL 라우팅에 사용할 storeType과 branchId로 매장 정보를 조회합니다.',
    })
    @ApiParam({
        name: 'storeType',
        description: '매장 타입 경로값. 예: tacomolly',
        example: 'tacomolly',
    })
    @ApiParam({
        name: 'branchId',
        description: '지점 경로값. 예: gimpo',
        example: 'gimpo',
    })
    @ApiResponse({
        status: 200,
        description: '매장 조회 성공',
        schema: {
            example: {
                statusCode: 200,
                data: {
                    id: 'cm9abc123def456ghi',
                    name: '타코몰리 김포점',
                    storeType: 'tacomolly',
                    branchId: 'gimpo',
                    address: '경기도 김포시 장기동 123',
                    phoneNumber: '031-123-4567',
                    isActive: true,
                    isDeliveryEnabled: true,
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

    @Get(':storeId/stats/daily')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '매장 일일 통계',
        description: '오늘 주문 수, 매출 합계, 처리 중인 주문 수, 품절 메뉴 수를 반환합니다. 매장 소유자만 조회 가능.',
    })
    @ApiParam({ name: 'storeId', description: '매장 UUID' })
    @ApiResponse({
        status: 200,
        description: '통계 조회 성공',
        schema: {
            example: {
                statusCode: 200,
                data: {
                    todayOrderCount: 12,
                    todaySales: 158000,
                    pendingOrderCount: 3,
                    soldOutMenuCount: 1,
                },
            },
        },
    })
    async getStoreStats(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
    ) {
        return this.storesService.getStoreStats(user.id, storeId);
    }

    @Get(':storeId')
    @ApiOperation({
        summary: '매장 ID로 조회',
        description: '매장 UUID를 사용해 특정 매장의 상세 정보를 조회합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 UUID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: '매장 조회 성공',
        schema: {
            example: {
                statusCode: 200,
                data: {
                    id: 'cm9abc123def456ghi',
                    name: '타코몰리 김포점',
                    storeType: 'tacomolly',
                    branchId: 'gimpo',
                    address: '경기도 김포시 장기동 123',
                    phoneNumber: '031-123-4567',
                    isActive: true,
                    isDeliveryEnabled: true,
                    tableCount: 20,
                    createdAt: '2024-01-01T00:00:00.000Z',
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

    @Patch(':storeId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: '매장 정보 수정',
        description: '관리자 또는 해당 매장 사장님이 매장 정보와 배달 운영 설정을 수정합니다.',
    })
    @ApiBody({ type: UpdateStoreDto })
    @ApiResponse({ status: 200, description: '매장 수정 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '매장을 찾을 수 없음' })
    async updateStore(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Body() dto: UpdateStoreDto,
    ) {
        return this.storesService.updateStore(user.id, storeId, dto);
    }

    @Post(':storeId/tables/bulk')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: '테이블 일괄 생성',
        description: '매장 초기 설정에서 QR 테이블오더용 테이블을 일괄 생성합니다.',
    })
    @ApiBody({ type: CreateTablesDto })
    async createTables(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Body() dto: CreateTablesDto,
    ) {
        return this.storesService.createTables(user.id, storeId, dto);
    }

    @Get(':storeId/tables')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '테이블 목록 조회',
        description: '관리자가 매장 테이블과 QR 생성에 필요한 정보를 조회합니다.',
    })
    async getTables(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
    ) {
        return this.storesService.getTables(user.id, storeId);
    }
}
