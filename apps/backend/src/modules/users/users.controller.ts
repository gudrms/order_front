import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';
import { AuthenticatedUser, UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me/addresses')
    @ApiOperation({
        summary: '내 배달 주소 목록 조회',
        description: '로그인한 사용자의 저장 주소를 기본 주소 우선으로 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '주소 목록 조회 성공' })
    async getMyAddresses(@CurrentUser() user: AuthenticatedUser) {
        return this.usersService.getAddresses(user.id);
    }

    @Post('me/addresses')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: '내 배달 주소 추가',
        description: '로그인한 사용자에게 새 배달 주소를 저장합니다. 첫 주소는 자동으로 기본 주소가 됩니다.',
    })
    @ApiBody({ type: CreateAddressDto })
    @ApiResponse({ status: 201, description: '주소 추가 성공' })
    async createAddress(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateAddressDto,
    ) {
        return this.usersService.createAddress(user, dto);
    }

    @Patch('me/addresses/:id')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: '내 배달 주소 수정',
        description: '로그인한 사용자가 소유한 주소만 수정할 수 있습니다.',
    })
    @ApiParam({ name: 'id', description: '주소 ID' })
    @ApiBody({ type: UpdateAddressDto })
    @ApiResponse({ status: 200, description: '주소 수정 성공' })
    async updateAddress(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') addressId: string,
        @Body() dto: UpdateAddressDto,
    ) {
        return this.usersService.updateAddress(user.id, addressId, dto);
    }

    @Patch('me/addresses/:id/default')
    @ApiOperation({
        summary: '기본 배달 주소 설정',
        description: '선택한 주소를 기본 배달 주소로 지정하고 기존 기본 주소는 해제합니다.',
    })
    @ApiParam({ name: 'id', description: '주소 ID' })
    @ApiResponse({ status: 200, description: '기본 주소 설정 성공' })
    async setDefaultAddress(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') addressId: string,
    ) {
        return this.usersService.setDefaultAddress(user.id, addressId);
    }

    @Delete('me/addresses/:id')
    @ApiOperation({
        summary: '내 배달 주소 삭제',
        description: '로그인한 사용자가 소유한 주소만 삭제할 수 있습니다. 기본 주소 삭제 시 남은 최신 주소를 기본 주소로 지정합니다.',
    })
    @ApiParam({ name: 'id', description: '주소 ID' })
    @ApiResponse({ status: 200, description: '주소 삭제 성공' })
    async deleteAddress(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') addressId: string,
    ) {
        return this.usersService.deleteAddress(user.id, addressId);
    }

    @Get('me/favorites')
    @ApiOperation({ summary: '내 찜 메뉴 목록 조회' })
    async getMyFavorites(@CurrentUser() user: AuthenticatedUser) {
        return this.usersService.getFavorites(user.id);
    }

    @Post('me/favorites/:menuId')
    @ApiOperation({ summary: '찜 메뉴 추가' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    async addFavorite(
        @CurrentUser() user: AuthenticatedUser,
        @Param('menuId') menuId: string,
    ) {
        return this.usersService.addFavorite(user.id, menuId);
    }

    @Delete('me/favorites/:menuId')
    @ApiOperation({ summary: '찜 메뉴 삭제' })
    @ApiParam({ name: 'menuId', description: '메뉴 ID' })
    async removeFavorite(
        @CurrentUser() user: AuthenticatedUser,
        @Param('menuId') menuId: string,
    ) {
        return this.usersService.removeFavorite(user.id, menuId);
    }
}
