import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // TODO: Auth Guard implementation needed

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // TODO: Add Auth Guard to all endpoints

    @Get('me/addresses')
    async getMyAddresses(@Request() req) {
        // const userId = req.user.id;
        const userId = 'test-user-id'; // TODO: Replace with actual user ID from JWT
        return this.usersService.getAddresses(userId);
    }

    @Post('me/addresses')
    async createAddress(@Request() req, @Body() dto: CreateAddressDto) {
        // const userId = req.user.id;
        const userId = 'test-user-id'; // TODO: Replace with actual user ID from JWT
        return this.usersService.createAddress(userId, dto);
    }

    @Delete('me/addresses/:id')
    async deleteAddress(@Request() req, @Param('id') addressId: string) {
        // const userId = req.user.id;
        const userId = 'test-user-id'; // TODO: Replace with actual user ID from JWT
        return this.usersService.deleteAddress(userId, addressId);
    }

    @Get('me/favorites')
    async getMyFavorites(@Request() req) {
        // const userId = req.user.id;
        const userId = 'test-user-id'; // TODO: Replace with actual user ID
        return this.usersService.getFavorites(userId);
    }

    @Post('me/favorites/:menuId')
    async addFavorite(@Request() req, @Param('menuId') menuId: string) {
        // const userId = req.user.id;
        const userId = 'test-user-id'; // TODO: Replace with actual user ID
        return this.usersService.addFavorite(userId, menuId);
    }

    @Delete('me/favorites/:menuId')
    async removeFavorite(@Request() req, @Param('menuId') menuId: string) {
        // const userId = req.user.id;
        const userId = 'test-user-id'; // TODO: Replace with actual user ID
        return this.usersService.removeFavorite(userId, menuId);
    }
}
