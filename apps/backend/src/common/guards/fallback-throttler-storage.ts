import { Logger } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

/**
 * rate limit 저장소(Redis) 오류 시 in-memory 저장소로 대신 세는 래퍼.
 *
 * Upstash 무료 한도 초과(`ERR max requests limit exceeded`)나 연결 장애가 나면
 * 기본 동작은 가드에서 예외 → 모든 API 500이 된다. 그렇다고 그냥 통과시키면
 * 로그인·결제 brute force 방어가 사라지므로, 인스턴스별 카운터로라도 제한을 유지한다.
 */
export class FallbackThrottlerStorage implements ThrottlerStorage {
    private readonly logger = new Logger(FallbackThrottlerStorage.name);
    private readonly fallback = new ThrottlerStorageService();
    private warned = false;

    constructor(private readonly primary: ThrottlerStorage) {}

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        try {
            return await this.primary.increment(key, ttl, limit, blockDuration, throttlerName);
        } catch (error) {
            // 요청마다 찍히면 로그가 폭주하므로 인스턴스당 한 번만 남긴다.
            if (!this.warned) {
                this.warned = true;
                this.logger.warn(
                    `Throttler storage failed, falling back to in-memory rate limit: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
            return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
        }
    }
}
