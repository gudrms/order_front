import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronController } from './cron.controller';
import { PrismaService } from './modules/prisma/prisma.service';
import { MenusService } from './modules/menus/menus.service';
import { QueueConsumerService } from './modules/queue/queue-consumer.service';
import { PaymentsService } from './modules/payments/payments.service';

describe('CronController', () => {
    let controller: CronController;

    const mockConfigService = {
        get: vi.fn((key: string) => {
            if (key === 'INTERNAL_JOB_SECRET') return 'super-secret-job-key-12345';
            return null;
        }),
    };

    const mockPrismaService = {
        $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
        store: {
            findMany: vi.fn().mockResolvedValue([
                { id: 'store-1', name: 'Taco Molly Gangnam' },
                { id: 'store-2', name: 'Taco Molly Yeoksam' },
            ]),
        },
    };

    const mockMenusService = {
        getMenus: vi.fn().mockResolvedValue([{ id: 'menu-1' }]),
    };

    const mockQueueConsumerService = {
        processOnce: vi.fn().mockResolvedValue({ processed: 3 }),
    };

    const mockPaymentsService = {
        expirePendingTossPayments: vi.fn().mockResolvedValue({ expired: 2 }),
        reconcileTossPayments: vi.fn().mockResolvedValue({ reconciled: 1 }),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CronController],
            providers: [
                { provide: ConfigService, useValue: mockConfigService },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: MenusService, useValue: mockMenusService },
                { provide: QueueConsumerService, useValue: mockQueueConsumerService },
                { provide: PaymentsService, useValue: mockPaymentsService },
            ],
        }).compile();

        controller = module.get<CronController>(CronController);
    });

    it('should throw UnauthorizedException if secret is missing or invalid', async () => {
        await expect(controller.runCronBatch(undefined)).rejects.toThrow(UnauthorizedException);
        await expect(controller.runCronBatch('wrong-secret')).rejects.toThrow(UnauthorizedException);
        
        expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should successfully execute the unified cron pipeline in sequence', async () => {
        const result = await controller.runCronBatch('super-secret-job-key-12345');

        expect(result).toMatchObject({
            statusCode: 201,
            success: true,
            results: {
                dbPing: true,
                warmUpStoresCount: 2,
                queueConsumed: { processed: 3 },
                expiredPayments: { expired: 2 },
                reconciledPayments: { reconciled: 1 },
            },
        });

        // 1. DB Health
        expect(mockPrismaService.$queryRaw).toHaveBeenCalled();

        // 2. Warm-up
        expect(mockPrismaService.store.findMany).toHaveBeenCalledWith({
            where: { isActive: true },
            select: { id: true, name: true },
        });
        expect(mockMenusService.getMenus).toHaveBeenCalledTimes(2);
        expect(mockMenusService.getMenus).toHaveBeenNthCalledWith(1, 'store-1');
        expect(mockMenusService.getMenus).toHaveBeenNthCalledWith(2, 'store-2');

        // 3. Queue processing
        expect(mockQueueConsumerService.processOnce).toHaveBeenCalledWith({ quantity: 3 });

        // 4. Payments Expire
        expect(mockPaymentsService.expirePendingTossPayments).toHaveBeenCalledWith({});

        // 5. Payments Reconcile
        expect(mockPaymentsService.reconcileTossPayments).toHaveBeenCalledWith({});
    });

    it('should continue executing other steps even if store warm-up fails for some stores', async () => {
        mockMenusService.getMenus.mockRejectedValueOnce(new Error('Prisma warm-up fail'));

        const result = await controller.runCronBatch('super-secret-job-key-12345');

        expect(result).toMatchObject({
            statusCode: 201,
            success: true,
            results: {
                dbPing: true,
                warmUpStoresCount: 1, // 1 out of 2 succeeded
                queueConsumed: { processed: 3 },
                expiredPayments: { expired: 2 },
                reconciledPayments: { reconciled: 1 },
            },
        });

        expect(mockMenusService.getMenus).toHaveBeenCalledTimes(2);
        expect(mockQueueConsumerService.processOnce).toHaveBeenCalled();
        expect(mockPaymentsService.expirePendingTossPayments).toHaveBeenCalled();
        expect(mockPaymentsService.reconcileTossPayments).toHaveBeenCalled();
    });
});
