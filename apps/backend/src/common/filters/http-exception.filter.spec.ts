import { ArgumentsHost, HttpException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

const { captureException, flush } = vi.hoisted(() => ({
    captureException: vi.fn(),
    flush: vi.fn().mockResolvedValue(true),
}));

vi.mock('@sentry/nestjs', () => ({
    captureException,
    flush,
}));

function createHost(exceptionPath = '/api/v1/test') {
    const response = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
    };
    const request = {
        method: 'GET',
        url: exceptionPath,
    };

    const host = {
        switchToHttp: () => ({
            getResponse: () => response,
            getRequest: () => request,
        }),
    } as unknown as ArgumentsHost;

    return { host, request, response };
}

describe('HttpExceptionFilter', () => {
    let filter: HttpExceptionFilter;

    beforeEach(() => {
        vi.clearAllMocks();
        filter = new HttpExceptionFilter();
    });

    it('captures 500-level exceptions in Sentry and preserves the response shape', async () => {
        const { host, response } = createHost('/api/v1/boom');
        const error = new InternalServerErrorException('boom');

        await filter.catch(error, host);

        expect(captureException).toHaveBeenCalledWith(error, {
            tags: {
                source: 'backend-http-filter',
                method: 'GET',
                path: '/api/v1/boom',
                statusCode: '500',
            },
        });
        expect(flush).toHaveBeenCalledWith(2000);
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 500,
            path: '/api/v1/boom',
            message: 'boom',
        }));
    });

    it('does not capture expected 4xx control-flow errors in Sentry', async () => {
        const { host, response } = createHost('/api/v1/cron/batch');

        await filter.catch(new UnauthorizedException('Invalid internal job secret'), host);

        expect(captureException).not.toHaveBeenCalled();
        expect(flush).not.toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 401,
            path: '/api/v1/cron/batch',
            message: 'Invalid internal job secret',
        }));
    });

    it('captures other 5xx HTTP exceptions in Sentry', async () => {
        const { host, response } = createHost('/api/v1/upstream');
        const error = new HttpException('upstream unavailable', 503);

        await filter.catch(error, host);

        expect(captureException).toHaveBeenCalledWith(error, expect.objectContaining({
            tags: expect.objectContaining({ statusCode: '503' }),
        }));
        expect(response.status).toHaveBeenCalledWith(503);
    });
});
