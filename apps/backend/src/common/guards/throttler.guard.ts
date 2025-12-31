/**
 * Custom Throttler Guard
 * Rate Limiting 커스터마이징
 */

import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * 에러 메시지 커스터마이징
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
  }

  /**
   * IP 주소 추출
   * Vercel Serverless 환경에서는 x-forwarded-for 헤더 사용
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Vercel Serverless 환경
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    }

    // 로컬 개발 환경
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}
