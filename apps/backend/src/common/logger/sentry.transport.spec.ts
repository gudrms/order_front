import { describe, it, expect, vi, beforeEach } from 'vitest';

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock('@sentry/nestjs', () => ({ captureException }));

import { SentryTransport } from './sentry.transport';

describe('SentryTransport', () => {
    let transport: SentryTransport;

    beforeEach(() => {
        vi.clearAllMocks();
        transport = new SentryTransport();
    });

    it('calls Sentry.captureException for error-level logs', async () => {
        await new Promise<void>((resolve) => {
            transport.log({ level: 'error', message: 'Something exploded' }, resolve);
        });

        expect(captureException).toHaveBeenCalledOnce();
        const [err, ctx] = captureException.mock.calls[0];
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Something exploded');
        expect(ctx.level).toBe('error');
        expect(ctx.tags.source).toBe('backend');
    });

    it('calls Sentry.captureException for fatal-level logs', async () => {
        await new Promise<void>((resolve) => {
            transport.log({ level: 'fatal', message: 'Critical failure' }, resolve);
        });

        expect(captureException).toHaveBeenCalledOnce();
        expect(captureException.mock.calls[0][1].level).toBe('fatal');
    });

    it('does not call Sentry for warn-level logs', async () => {
        await new Promise<void>((resolve) => {
            transport.log({ level: 'warn', message: 'Just a warning' }, resolve);
        });

        expect(captureException).not.toHaveBeenCalled();
    });

    it('does not call Sentry for info-level logs', async () => {
        await new Promise<void>((resolve) => {
            transport.log({ level: 'info', message: 'FYI' }, resolve);
        });

        expect(captureException).not.toHaveBeenCalled();
    });

    it('preserves the original stack trace when provided', async () => {
        const stack = 'Error: boom\n    at doThing (file.ts:10:5)';
        await new Promise<void>((resolve) => {
            transport.log({ level: 'error', message: 'boom', stack }, resolve);
        });

        const err = captureException.mock.calls[0][0] as Error;
        expect(err.stack).toBe(stack);
    });

    it('attaches storeId and userId as Sentry extra context', async () => {
        await new Promise<void>((resolve) => {
            transport.log({ level: 'error', message: 'store error', storeId: 'store-1', userId: 'user-1' }, resolve);
        });

        const ctx = captureException.mock.calls[0][1];
        expect(ctx.extra.storeId).toBe('store-1');
        expect(ctx.extra.userId).toBe('user-1');
    });
});
