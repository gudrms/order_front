/**
 * NestJS Logger Service (Winston 사용)
 */

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { winstonLogger } from './winston.logger';

@Injectable()
export class LoggerService implements NestLoggerService {
  /**
   * 일반 로그
   */
  log(message: any, context?: string) {
    winstonLogger.info(message, { context });
  }

  /**
   * 에러 로그 (DB 저장됨)
   */
  error(message: any, trace?: string, context?: string) {
    winstonLogger.error(message, {
      context,
      stack: trace,
    });
  }

  /**
   * 경고 로그
   */
  warn(message: any, context?: string) {
    winstonLogger.warn(message, { context });
  }

  /**
   * 디버그 로그
   */
  debug(message: any, context?: string) {
    winstonLogger.debug(message, { context });
  }

  /**
   * Verbose 로그
   */
  verbose(message: any, context?: string) {
    winstonLogger.verbose(message, { context });
  }

  /**
   * Critical 에러 로그 (DB 저장됨)
   * 비즈니스 로직에서 심각한 에러 발생 시 사용
   */
  critical(message: string, meta?: Record<string, any>) {
    winstonLogger.log('error', message, {
      ...meta,
      severity: 'CRITICAL',
    });
  }
}
