import { Module } from '@nestjs/common';
import { PosService } from './pos.service';

@Module({
    providers: [PosService],
    exports: [PosService],
})
export class PosModule { }
