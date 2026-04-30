import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MockPosService } from './pos.service';
import { ResilientPosService } from './pos.resilience';
import { PosController } from './pos.controller';
import { PosIntegrationGuard } from './pos-integration.guard';

@Module({
    imports: [ConfigModule],
    controllers: [PosController],
    providers: [
        MockPosService,
        {
            provide: 'POS_PROVIDER',
            useExisting: MockPosService,
        },
        ResilientPosService,
        PosIntegrationGuard,
    ],
    exports: [ResilientPosService],
})
export class PosModule { }
