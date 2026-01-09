/**
 * Winston Sentry Transport
 * Winston 로그를 Sentry로 전송
 */

import Transport from 'winston-transport';
import * as Sentry from '@sentry/nestjs';

interface SentryTransportOptions extends Transport.TransportStreamOptions {
  // Sentry-specific options can be added here
}

/**
 * Sentry로 로그를 전송하는 Winston Transport
 */
export class SentryTransport extends Transport {
  constructor(opts: SentryTransportOptions = {}) {
    super(opts);
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      // Winston level을 Sentry level로 매핑
      const sentryLevel = this.mapLevelToSentryLevel(info.level);

      // error 이상만 Sentry로 전송
      if (sentryLevel === 'error' || sentryLevel === 'fatal') {
        // 에러 객체 생성
        const error = new Error(info.message || String(info));

        // Stack trace가 있으면 설정
        if (info.stack) {
          error.stack = info.stack;
        }

        // Sentry에 전송
        Sentry.captureException(error, {
          level: sentryLevel,
          tags: {
            app: 'backend', // 앱 구분 태그
            errorCode: info.code || info.errorCode || 'UNKNOWN',
            source: 'backend',
            context: info.context,
          },
          extra: {
            storeId: info.storeId,
            tableNumber: info.tableNumber,
            userId: info.userId,
            metadata: info.metadata || info.meta,
          },
        });
      }
    } catch (error) {
      // 로깅 실패는 무시 (무한 루프 방지)
      console.error('[SentryTransport] Failed to log to Sentry:', error);
    }

    callback();
  }

  /**
   * Winston level을 Sentry level로 매핑
   */
  private mapLevelToSentryLevel(
    level: string,
  ): 'info' | 'warning' | 'error' | 'fatal' {
    switch (level.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warn':
      case 'warning':
        return 'warning';
      case 'info':
      case 'log':
      case 'debug':
      case 'verbose':
        return 'info';
      case 'crit':
      case 'critical':
      case 'fatal':
        return 'fatal';
      default:
        return 'info';
    }
  }
}
