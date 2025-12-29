import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseGuard } from './guards/supabase.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() body: { id: string; email: string; name?: string }) {
        return this.authService.register(body);
    }

    @Get('me')
    @UseGuards(SupabaseGuard)
    getProfile(@Request() req) {
        return req.user;
    }
}
