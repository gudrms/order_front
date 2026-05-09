import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(SupabaseGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me/addresses')
    @ApiOperation({ summary: '내 배달 주소 목록 조회', description: '로그인 사용자의 저장된 배달 주소 목록을 반환합니다.' })
    @ApiResponse({
        status: 200,
        description: '주소 목록 조회 성공',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    {
                        id: 'addr-uuid-1',
                        recipientName: '홍길동',
                        recipientPhone: '010-1234-5678',
                        address: '서울시 강남구 테헤란로 123',
                        detailAddress: '101동 1001호',
                        zipCode: '06234',
                        deliveryMemo: '문 앞에 두고 벨 눌러주세요.',
                        isDefault: true,
                    },
                ],
            },
        },
    })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async getMyAddresses(@CurrentUser() user: { id: string }) {
        return this.usersService.getAddresses(user.id);
    }

    @Post('me/addresses')
    @ApiOperation({ summary: '배달 주소 추가', description: '로그인 사용자의 배달 주소를 추가합니다.' })
    @ApiResponse({
        status: 201,
        description: '주소 추가 성공',
        schema: {
            example: {
                statusCode: 201,
                data: {
                    id: 'addr-uuid-2',
                    recipientName: '홍길동',
                    recipientPhone: '010-1234-5678',
                    address: '서울시 강남구 테헤란로 123',
                    detailAddress: '101동 1001호',
                    zipCode: '06234',
                    deliveryMemo: '문 앞에 두고 벨 눌러주세요.',
                    isDefault: false,
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async createAddress(
        @CurrentUser() user: { id: string; email?: string; userMetadata?: Record<string, unknown> },
        @Body() dto: CreateAddressDto,
    ) {
        return this.usersService.createAddress(user, dto);
    }

    @Delete('me/addresses/:id')
    @HttpCode(200)
    @ApiOperation({ summary: '배달 주소 삭제', description: '로그인 사용자의 배달 주소를 삭제합니다.' })
    @ApiParam({ name: 'id', description: '주소 ID' })
    @ApiResponse({ status: 200, description: '주소 삭제 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '주소를 찾을 수 없음' })
    async deleteAddress(
        @CurrentUser() user: { id: string },
        @Param('id') addressId: string,
    ) {
        return this.usersService.deleteAddress(user.id, addressId);
    }

    @Get('me/favorites')
    @ApiOperation({ summary: '내 찜 목록 조회', description: '로그인 사용자가 찜한 메뉴 목록을 반환합니다.' })
    @ApiResponse({
        status: 200,
        description: '찜 목록 조회 성공',
        schema: {
            example: {
                statusCode: 200,
                data: [
                    {
                        id: 'fav-uuid-1',
                        menuId: 'menu-uuid-1',
                        menu: {
                            id: 'menu-uuid-1',
                            name: '비프 타코',
                            price: 9500,
                            imageUrl: 'https://cdn.tacomole.kr/menus/beef-taco.jpg',
                        },
                        createdAt: '2024-01-01T00:00:00.000Z',
                    },
                ],
            },
        },
    })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async getMyFavorites(@CurrentUser() user: { id: string }) {
        return this.usersService.getFavorites(user.id);
    }

    @Post('me/favorites/:menuId')
    @ApiOperation({ summary: '찜 추가', description: '로그인 사용자가 메뉴를 찜 목록에 추가합니다.' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiResponse({ status: 201, description: '찜 추가 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async addFavorite(
        @CurrentUser() user: { id: string },
        @Param('menuId') menuId: string,
    ) {
        return this.usersService.addFavorite(user.id, menuId);
    }

    @Delete('me/favorites/:menuId')
    @HttpCode(200)
    @ApiOperation({ summary: '찜 삭제', description: '로그인 사용자가 메뉴를 찜 목록에서 제거합니다.' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    @ApiResponse({ status: 200, description: '찜 삭제 성공' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async removeFavorite(
        @CurrentUser() user: { id: string },
        @Param('menuId') menuId: string,
    ) {
        return this.usersService.removeFavorite(user.id, menuId);
    }
}
