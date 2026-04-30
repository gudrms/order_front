import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
    async getMyAddresses(@CurrentUser() user: { id: string }) {
        return this.usersService.getAddresses(user.id);
    }

    @Post('me/addresses')
    async createAddress(
        @CurrentUser() user: { id: string; email?: string; userMetadata?: Record<string, unknown> },
        @Body() dto: CreateAddressDto,
    ) {
        return this.usersService.createAddress(user, dto);
    }

    @Delete('me/addresses/:id')
    @HttpCode(200)
    async deleteAddress(
        @CurrentUser() user: { id: string },
        @Param('id') addressId: string,
    ) {
        return this.usersService.deleteAddress(user.id, addressId);
    }

    @Get('me/favorites')
    async getMyFavorites(@CurrentUser() user: { id: string }) {
        return this.usersService.getFavorites(user.id);
    }

    @Post('me/favorites/:menuId')
    async addFavorite(
        @CurrentUser() user: { id: string },
        @Param('menuId') menuId: string,
    ) {
        return this.usersService.addFavorite(user.id, menuId);
    }

    @Delete('me/favorites/:menuId')
    @HttpCode(200)
    async removeFavorite(
        @CurrentUser() user: { id: string },
        @Param('menuId') menuId: string,
    ) {
        return this.usersService.removeFavorite(user.id, menuId);
    }
}
