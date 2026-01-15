import { Module } from '@nestjs/common';
import { MockPosService } from './pos.service';
import { ResilientPosService } from './pos.resilience';
import { PosController } from './pos.controller';

@Module({
    controllers: [PosController],
    providers: [
        MockPosService,
        {
            provide: 'POS_PROVIDER',
            useExisting: MockPosService,
        },
        ResilientPosService,
    ],
    exports: [ResilientPosService],
})
export class PosModule { }
