import { describe, expect, it, vi } from 'vitest';
import { FailOpenThrottlerStorage } from './fail-open-throttler-storage';

describe('FailOpenThrottlerStorage', () => {
    it('passes through the inner storage result', async () => {
        const record = { totalHits: 3, timeToExpire: 10, isBlocked: true, timeToBlockExpire: 5 };
        const inner = { increment: vi.fn().mockResolvedValue(record) };
        const storage = new FailOpenThrottlerStorage(inner);

        await expect(storage.increment('k', 1000, 10, 1000, 'short')).resolves.toEqual(record);
        expect(inner.increment).toHaveBeenCalledWith('k', 1000, 10, 1000, 'short');
    });

    it('allows the request when the inner storage throws (e.g. Upstash quota exceeded)', async () => {
        const inner = {
            increment: vi.fn().mockRejectedValue(new Error('ERR max requests limit exceeded')),
        };
        const storage = new FailOpenThrottlerStorage(inner);

        const result = await storage.increment('k', 1000, 10, 1000, 'short');

        expect(result.isBlocked).toBe(false);
        expect(result.totalHits).toBe(0);
    });
});
