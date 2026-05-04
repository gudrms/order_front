import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceService {
    constructor(private readonly prisma: PrismaService) {}

    async registerDevice(userId: string, fcmToken: string, deviceType?: string) {
        return this.prisma.userDevice.upsert({
            where: { fcmToken },
            create: {
                userId,
                fcmToken,
                deviceType,
            },
            update: {
                userId, // 토큰 소유자가 바뀔 수도 있으므로 업데이트
                deviceType,
                updatedAt: new Date(),
            },
        });
    }

    async unregisterDevice(userId: string, fcmToken: string) {
        // 본인의 토큰만 삭제 가능하도록 userId 조건 추가
        const device = await this.prisma.userDevice.findFirst({
            where: { userId, fcmToken },
        });

        if (device) {
            await this.prisma.userDevice.delete({
                where: { id: device.id },
            });
        }
    }
}
