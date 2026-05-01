import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect } from 'vitest';
import { AppController } from './app.controller';

describe('AppController', () => {
    let controller: AppController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
        }).compile();

        controller = module.get<AppController>(AppController);
    });

    it('returns system status on root endpoint', () => {
        const result = controller.getRoot();

        expect(result).toMatchObject({
            status: 'running',
            endpoints: expect.objectContaining({
                health: expect.any(String),
                stores: expect.any(String),
            }),
        });
    });

    it('throws an error on the Sentry test endpoint', () => {
        expect(() => controller.getSentryError()).toThrow('Sentry Test Error (Backend) - API Server');
    });
});
