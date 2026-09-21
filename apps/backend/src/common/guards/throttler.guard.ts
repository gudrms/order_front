import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException('요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요');
  }

  /**
   * rate limit 버킷을 나눌 클라이언트 식별자.
   *
   * `x-forwarded-for`는 프록시가 **뒤에 덧붙이는** 헤더다. 클라이언트가 직접 이 헤더를 보내면
   * 그 값이 맨 앞에 오므로, 첫 값만 믿으면 값을 매 요청 바꿔 rate limit을 무제한 우회할 수 있다.
   * 로그인·결제 제한이 무력화되는 문제다.
   *
   * 그래서 플랫폼이 직접 설정하는 헤더를 먼저 본다. Vercel은 `x-vercel-forwarded-for`와
   * `x-real-ip`를 자기가 채우고 클라이언트가 보낸 동명 헤더는 덮어쓴다.
   * 이 둘이 없는 환경(로컬·자체 호스팅)에서만 기존처럼 `x-forwarded-for`로 떨어진다.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const headers = req.headers ?? {};

    const trusted =
      this.getFirstHeaderValue(headers['x-vercel-forwarded-for']) ||
      this.getFirstHeaderValue(headers['x-real-ip']);

    if (trusted) {
      return trusted;
    }

    const forwardedFor = this.getFirstHeaderValue(headers['x-forwarded-for']);

    return forwardedFor || req.ip || req.connection?.remoteAddress || 'unknown';
  }

  private getFirstHeaderValue(value: string | string[] | undefined) {
    const header = Array.isArray(value) ? value[0] : value;
    return header?.split(',')[0]?.trim();
  }
}
