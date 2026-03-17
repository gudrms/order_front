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
        let userId = 'test-user-id';
        let email = 'test@example.com';
        let name = 'Test User';

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                if (payload.sub) {
                    userId = payload.sub;
                    email = payload.email || `${userId}@placeholder.com`;
                    name = payload.user_metadata?.full_name || payload.user_metadata?.name || 'User';
                }
            } catch (e) {
                console.error('Failed to parse JWT in createAddress', e);
            }
        }

        return this.usersService.createAddress(userId, email, name, dto);
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
