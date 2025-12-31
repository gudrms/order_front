import { Module } from '@nestjs/common';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService } from './error-logs.service';

@Module({
  controllers: [ErrorLogsController],
  providers: [ErrorLogsService]
})
export class ErrorLogsModule {}
