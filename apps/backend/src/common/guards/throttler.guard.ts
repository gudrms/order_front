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
    throw new ThrottlerException('Too many requests. Please try again later.');
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const clientIp = this.getFirstHeaderValue(forwardedFor);

    return clientIp || req.ip || req.connection?.remoteAddress || 'unknown';
  }

  private getFirstHeaderValue(value: string | string[] | undefined) {
    const header = Array.isArray(value) ? value[0] : value;
    return header?.split(',')[0]?.trim();
  }
}
