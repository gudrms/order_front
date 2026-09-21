import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';
import { describe, expect, it } from 'vitest';
import { CustomThrottlerGuard } from './throttler.guard';

/**
 * getTracker / throwThrottlingException 은 protected 라 테스트에서 직접 부르려고 노출한다.
 * 가드가 rate limit 버킷을 무엇으로 나누는지가 곧 신뢰 경계라 여기만 검증한다.
 */
class TestableThrottlerGuard extends CustomThrottlerGuard {
    track(req: Record<string, any>) {
        return this.getTracker(req);
    }

    throwLimit() {
        return this.throwThrottlingException(
            {} as ExecutionContext,
            {} as ThrottlerLimitDetail,
        );
    }
}

function createGuard() {
    // ThrottlerGuard 생성자 의존성은 getTracker 경로에서 쓰이지 않는다.
    return new TestableThrottlerGuard(
        undefined as any,
        undefined as any,
        undefined as any,
    );
}

describe('CustomThrottlerGuard', () => {
    describe('getTracker', () => {
        it('x-forwarded-for 단일 IP를 그대로 쓴다', async () => {
            await expect(
                createGuard().track({ headers: { 'x-forwarded-for': '203.0.113.7' } }),
            ).resolves.toBe('203.0.113.7');
        });

        it('x-forwarded-for에 IP가 여러 개면 첫 번째만 쓴다', async () => {
            await expect(
                createGuard().track({
                    headers: { 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' },
                }),
            ).resolves.toBe('203.0.113.7');
        });

        it('헤더가 배열로 오면 첫 항목의 첫 IP를 쓴다', async () => {
            await expect(
                createGuard().track({
                    headers: { 'x-forwarded-for': ['203.0.113.7, 70.41.3.18', '198.51.100.2'] },
                }),
            ).resolves.toBe('203.0.113.7');
        });

        it('IP 앞뒤 공백을 제거한다', async () => {
            await expect(
                createGuard().track({ headers: { 'x-forwarded-for': '  203.0.113.7  ,70.41.3.18' } }),
            ).resolves.toBe('203.0.113.7');
        });

        it('헤더가 없으면 req.ip로 떨어진다', async () => {
            await expect(
                createGuard().track({ headers: {}, ip: '198.51.100.9' }),
            ).resolves.toBe('198.51.100.9');
        });

        it('헤더가 빈 문자열이어도 req.ip로 떨어진다', async () => {
            await expect(
                createGuard().track({ headers: { 'x-forwarded-for': '' }, ip: '198.51.100.9' }),
            ).resolves.toBe('198.51.100.9');
        });

        it('첫 항목이 비어 있으면(", 1.2.3.4") 그 빈 값을 쓰지 않고 req.ip로 떨어진다', async () => {
            await expect(
                createGuard().track({
                    headers: { 'x-forwarded-for': ' , 70.41.3.18' },
                    ip: '198.51.100.9',
                }),
            ).resolves.toBe('198.51.100.9');
        });

        it('headers 자체가 없어도 터지지 않고 req.ip로 떨어진다', async () => {
            await expect(createGuard().track({ ip: '198.51.100.9' })).resolves.toBe('198.51.100.9');
        });

        it('req.ip가 없으면 connection.remoteAddress로 떨어진다', async () => {
            await expect(
                createGuard().track({ headers: {}, connection: { remoteAddress: '10.0.0.4' } }),
            ).resolves.toBe('10.0.0.4');
        });

        it('식별할 값이 아무것도 없으면 unknown으로 묶는다', async () => {
            await expect(createGuard().track({ headers: {} })).resolves.toBe('unknown');
        });
    });

    describe('throwThrottlingException', () => {
        it('제한 초과 시 한글 안내로 ThrottlerException(429)을 던진다', async () => {
            await expect(createGuard().throwLimit()).rejects.toBeInstanceOf(ThrottlerException);
            await expect(createGuard().throwLimit()).rejects.toThrow('요청이 너무 잦습니다');
        });
    });
});
