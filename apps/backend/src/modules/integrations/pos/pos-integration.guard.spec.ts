import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { PosIntegrationGuard } from './pos-integration.guard';

function createContext(headers: Record<string, string | string[] | undefined>): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => ({ headers }),
        }),
    } as unknown as ExecutionContext;
}

describe('PosIntegrationGuard', () => {
    it('allows requests with a matching POS API key', () => {
        const configService = {
            get: vi.fn().mockReturnValue('secret-key'),
        } as unknown as ConfigService;
        const guard = new PosIntegrationGuard(configService);

        expect(guard.canActivate(createContext({ 'x-pos-api-key': 'secret-key' }))).toBe(true);
    });

    it('rejects requests when the POS API key is not configured', () => {
        const configService = {
            get: vi.fn().mockReturnValue(undefined),
        } as unknown as ConfigService;
        const guard = new PosIntegrationGuard(configService);

        expect(() => guard.canActivate(createContext({ 'x-pos-api-key': 'secret-key' })))
            .toThrow(UnauthorizedException);
    });

    it('rejects requests with a missing or mismatched POS API key', () => {
        const configService = {
            get: vi.fn().mockReturnValue('secret-key'),
        } as unknown as ConfigService;
        const guard = new PosIntegrationGuard(configService);

        expect(() => guard.canActivate(createContext({}))).toThrow(UnauthorizedException);
        expect(() => guard.canActivate(createContext({ 'x-pos-api-key': 'wrong-key' })))
            .toThrow(UnauthorizedException);
    });
});
