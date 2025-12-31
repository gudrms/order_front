/**
 * Winston Supabase Transport
 * Winston 로그를 Supabase error_logs 테이블에 저장
 */

import Transport from 'winston-transport';
import { PrismaClient } from '@prisma/client';

interface SupabaseTransportOptions extends Transport.TransportStreamOptions {
  prisma?: PrismaClient;
}

/**
 * Supabase DB에 로그를 저장하는 Winston Transport
 */
export class SupabaseTransport extends Transport {
  private prisma: PrismaClient;

  constructor(opts: SupabaseTransportOptions = {}) {
    super(opts);
    this.prisma = opts.prisma || new PrismaClient();
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      // Winston level을 우리 ErrorSeverity로 매핑
      const severity = this.mapLevelToSeverity(info.level);

      // error 이상만 DB에 저장 (warn, info는 저장 안 함)
      if (severity === 'ERROR' || severity === 'CRITICAL') {
        await this.prisma.errorLog.create({
          data: {
            errorCode: info.code || info.errorCode || 'UNKNOWN',
            message: info.message || String(info),
            severity,
            source: 'BACKEND',
            stackTrace: info.stack || info.stackTrace || null,
            storeId: info.storeId || null,
            tableNumber: info.tableNumber || null,
            userId: info.userId || null,
            metadata: info.metadata || info.meta || null,
          },
        });
      }
    } catch (error) {
      // 로깅 실패는 무시 (무한 루프 방지)
      console.error('[SupabaseTransport] Failed to log to database:', error);
    }

    callback();
  }

  /**
   * Winston level을 ErrorSeverity enum으로 매핑
   */
  private mapLevelToSeverity(
    level: string,
  ): 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' {
    switch (level.toLowerCase()) {
      case 'error':
        return 'ERROR';
      case 'warn':
      case 'warning':
        return 'WARNING';
      case 'info':
      case 'log':
      case 'debug':
      case 'verbose':
        return 'INFO';
      case 'crit':
      case 'critical':
      case 'fatal':
        return 'CRITICAL';
      default:
        return 'INFO';
    }
  }

  /**
   * Transport 종료 시 Prisma 연결 해제
   */
  async close() {
    await this.prisma.$disconnect();
  }
}
