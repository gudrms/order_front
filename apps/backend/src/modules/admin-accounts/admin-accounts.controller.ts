import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { AdminAccountsService } from './admin-accounts.service';
import { CreateAdminAccountDto, ResetAdminAccountPasswordDto } from './dto/admin-account.dto';

@ApiTags('Admin Accounts')
@Controller('admin/accounts')
@UseGuards(SupabaseGuard)
@ApiBearerAuth('JWT-auth')
export class AdminAccountsController {
    constructor(private readonly adminAccountsService: AdminAccountsService) {}

    @Get()
    @ApiOperation({ summary: '관리자 계정 목록 조회' })
    async list(@CurrentUser() user: { id: string }) {
        return this.adminAccountsService.list(user.id);
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '관리자 계정 생성' })
    async create(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateAdminAccountDto,
    ) {
        return this.adminAccountsService.create(user.id, dto);
    }

    @Patch(':userId/password')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: '관리자 계정 비밀번호 초기화' })
    async resetPassword(
        @CurrentUser() user: { id: string },
        @Param('userId') userId: string,
        @Body() dto: ResetAdminAccountPasswordDto,
    ) {
        return this.adminAccountsService.resetPassword(user.id, userId, dto.password);
    }

    @Delete(':userId')
    @ApiOperation({ summary: '관리자 계정 삭제' })
    async delete(
        @CurrentUser() user: { id: string },
        @Param('userId') userId: string,
    ) {
        return this.adminAccountsService.delete(user.id, userId);
    }
}
