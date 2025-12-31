import { Module } from '@nestjs/common';
import { MockPosService } from './pos.service';
import { ResilientPosService } from './pos.resilience';

@Module({
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
