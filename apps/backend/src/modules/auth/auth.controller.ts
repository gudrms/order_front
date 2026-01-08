import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthService } from './auth.service';
import { SupabaseGuard } from './guards/supabase.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({
        summary: '사용자 등록',
        description: 'Supabase 인증 후 시스템에 사용자를 등록합니다.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['id', 'email'],
            properties: {
                id: {
                    type: 'string',
                    description: 'Supabase User ID (UUID)',
                    example: '123e4567-e89b-12d3-a456-426614174000',
                },
                email: {
                    type: 'string',
                    format: 'email',
                    description: '사용자 이메일',
                    example: 'user@example.com',
                },
                name: {
                    type: 'string',
                    description: '사용자 이름 (선택사항)',
                    example: '홍길동',
                },
                phoneNumber: {
                    type: 'string',
                    description: '전화번호 (선택사항)',
                    example: '010-1234-5678',
                },
                inviteCode: {
                    type: 'string',
                    description: '매장 초대 코드 (선택사항)',
                    example: 'TACO-1234',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: '사용자 등록 성공',
        schema: {
            example: {
                success: true,
                data: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'user@example.com',
                    name: '홍길동',
                    phoneNumber: '010-1234-5678',
                    createdAt: '2024-01-01T00:00:00Z',
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    @ApiResponse({ status: 409, description: '이미 등록된 사용자' })
    async register(@Body() body: { id: string; email: string; name?: string; phoneNumber?: string; inviteCode?: string }) {
        return this.authService.register(body);
    }

    @Get('me')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '내 정보 조회 (인증 필요)',
        description: 'JWT 토큰을 사용하여 현재 로그인한 사용자의 정보를 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '사용자 정보 조회 성공',
        schema: {
            example: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'user@example.com',
                name: '홍길동',
                role: 'STAFF',
                createdAt: '2024-01-01T00:00:00Z',
            },
        },
    })
    @ApiResponse({ status: 401, description: '인증 실패 - 유효하지 않은 토큰' })
    getProfile(@CurrentUser() user) {
        return user;
    }
}
