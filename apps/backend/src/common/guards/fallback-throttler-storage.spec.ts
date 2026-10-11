import { describe, expect, it, vi } from 'vitest';
import { FallbackThrottlerStorage } from './fallback-throttler-storage';

describe('FallbackThrottlerStorage', () => {
    it('passes through the primary storage result', async () => {
        const record = { totalHits: 3, timeToExpire: 10, isBlocked: true, timeToBlockExpire: 5 };
        const primary = { increment: vi.fn().mockResolvedValue(record) };
        const storage = new FallbackThrottlerStorage(primary);

        await expect(storage.increment('k', 1000, 10, 1000, 'short')).resolves.toEqual(record);
        expect(primary.increment).toHaveBeenCalledWith('k', 1000, 10, 1000, 'short');
    });

    it('keeps rate limiting in memory when the primary storage throws (e.g. Upstash quota exceeded)', async () => {
        const primary = {
            increment: vi.fn().mockRejectedValue(new Error('ERR max requests limit exceeded')),
        };
        const storage = new FallbackThrottlerStorage(primary);

        const first = await storage.increment('k', 60_000, 2, 60_000, 'short');
        await storage.increment('k', 60_000, 2, 60_000, 'short');
        const third = await storage.increment('k', 60_000, 2, 60_000, 'short');

        expect(first.isBlocked).toBe(false);
        expect(third.isBlocked).toBe(true);
    });
});
