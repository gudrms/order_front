import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueController } from './queue.controller';

describe('QueueController', () => {
    let controller: QueueController;
    let consumerService: any;

    beforeEach(() => {
        consumerService = {
            processOnce: vi.fn(),
        };
        const config = { get: () => 'job-secret' } as any;
        controller = new QueueController(consumerService, config);
    });

    it('processes the queue when the internal secret matches', async () => {
        consumerService.processOnce.mockResolvedValue({ processedCount: 2 });

        const result = await controller.processOnce('job-secret', { quantity: 2 });

        expect(result).toEqual({ processedCount: 2 });
        expect(consumerService.processOnce).toHaveBeenCalledWith({ quantity: 2 });
    });

    it('rejects requests with an invalid secret', async () => {
        await expect(controller.processOnce('wrong-secret', {})).rejects.toBeInstanceOf(UnauthorizedException);
        expect(consumerService.processOnce).not.toHaveBeenCalled();
    });
});
