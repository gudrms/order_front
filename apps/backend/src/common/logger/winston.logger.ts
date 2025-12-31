/**
 * Winston Logger 설정
 * Console + Supabase DB에 로그 저장
 */

import * as winston from 'winston';
import { SupabaseTransport } from './supabase.transport';

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

    // 2. Supabase DB Transport (error 이상만)
    new SupabaseTransport({
      level: 'error', // error, critical만 DB 저장
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
