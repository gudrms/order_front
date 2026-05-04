import { Controller, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { DeviceService } from './device.service';
import { SupabaseGuard } from '../auth/guards/supabase.guard';

class RegisterDeviceDto {
    @ApiProperty({ description: 'FCM 디바이스 토큰' })
    fcmToken: string;

    @ApiProperty({ description: '기기 타입 (ios, android, web 등)', required: false })
    deviceType?: string;
}

@ApiTags('Devices')
@Controller('devices')
@UseGuards(SupabaseGuard)
@ApiBearerAuth()
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Post()
    @ApiOperation({ summary: 'FCM 디바이스 토큰 등록' })
    async registerDevice(@Request() req, @Body() dto: RegisterDeviceDto) {
        const userId = req.user.id;
        await this.deviceService.registerDevice(userId, dto.fcmToken, dto.deviceType);
        return { success: true };
    }

    @Delete(':fcmToken')
    @ApiOperation({ summary: 'FCM 디바이스 토큰 삭제 (로그아웃 시)' })
    async unregisterDevice(@Request() req, @Param('fcmToken') fcmToken: string) {
        const userId = req.user.id;
        await this.deviceService.unregisterDevice(userId, fcmToken);
        return { success: true };
    }
}
