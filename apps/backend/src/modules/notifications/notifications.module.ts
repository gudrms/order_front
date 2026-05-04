import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DeviceController],
    providers: [FirebaseService, DeviceService],
    exports: [FirebaseService, DeviceService],
})
export class NotificationsModule {}
