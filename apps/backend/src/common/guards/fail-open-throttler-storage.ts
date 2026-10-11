import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

/**
 * rate limit 저장소(Redis) 오류 시 요청을 막지 않고 통과시키는 래퍼.
 *
 * Upstash 무료 한도 초과(`ERR max requests limit exceeded`)나 연결 장애가 나면
 * 기본 동작은 가드에서 예외 → 모든 API 500이 된다. rate limit은 보조 방어선이라
 * 저장소가 죽었을 때 서비스 전체를 멈추는 것보다 제한 없이 통과시키는 편이 낫다.
 */
export class FailOpenThrottlerStorage implements ThrottlerStorage {
    private readonly logger = new Logger(FailOpenThrottlerStorage.name);
    private warned = false;

    constructor(private readonly inner: ThrottlerStorage) {}

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        try {
            return await this.inner.increment(key, ttl, limit, blockDuration, throttlerName);
        } catch (error) {
            // 요청마다 찍히면 로그가 폭주하므로 인스턴스당 한 번만 남긴다.
            if (!this.warned) {
                this.warned = true;
                this.logger.warn(
                    `Throttler storage failed, allowing requests without rate limit: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
            return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
        }
    }
}
