/**
 * Winston Logger 설정
 * Console + Supabase DB + Sentry에 로그 저장
 */

import * as winston from 'winston';
import { SupabaseTransport } from './supabase.transport';
import { SentryTransport } from './sentry.transport';

/**
 * 애플리케이션 전역 Winston Logger
 */
export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'order-backend' },
  transports: [
    // 1. Console Transport (모든 로그)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        }),
      ),
    }),

    // 2. Sentry Transport (error 이상만 - 실시간 알림용)
    new SentryTransport({
      level: 'error',
    }),

    // 3. Supabase DB Transport (error 이상만 - 백업/감사 로그용)
    new SupabaseTransport({
      level: 'error',
    }),
  ],
});

/**
 * Stream for Morgan HTTP logger
 */
export const winstonStream = {
  write: (message: string) => {
    winstonLogger.info(message.trim());
  },
};
