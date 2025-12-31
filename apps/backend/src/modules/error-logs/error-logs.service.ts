import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateErrorLogDto } from './dto/create-error-log.dto';

@Injectable()
export class ErrorLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateErrorLogDto) {
    return this.prisma.errorLog.create({
      data: {
        errorCode: dto.errorCode,
        message: dto.message,
        severity: dto.severity.toUpperCase() as any,
        source: 'FRONTEND',
        stackTrace: dto.stackTrace || null,
        url: dto.url || null,
        userAgent: dto.userAgent || null,
        storeId: dto.storeId || null,
        metadata: dto.metadata || null,
      },
    });
  }
}
