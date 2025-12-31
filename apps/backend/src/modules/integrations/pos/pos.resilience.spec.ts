import { Test, TestingModule } from '@nestjs/testing';
import { ResilientPosService } from './pos.resilience';
import { PosProvider } from './pos.interface';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ResilientPosService', () => {
    let service: ResilientPosService;
    let mockProvider: PosProvider;

    beforeEach(async () => {
        mockProvider = {
            sendOrder: vi.fn(),
            checkHealth: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResilientPosService,
                {
                    provide: 'POS_PROVIDER',
                    useValue: mockProvider,
                },
            ],
        }).compile();

        service = module.get<ResilientPosService>(ResilientPosService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should call provider.sendOrder successfully', async () => {
        (mockProvider.sendOrder as any).mockResolvedValue(true);
        const result = await service.sendOrder({ orderNumber: '123' } as any);
        expect(result).toBe(true);
        expect(mockProvider.sendOrder).toHaveBeenCalled();
    });

    it('should handle provider errors gracefully (return false)', async () => {
        (mockProvider.sendOrder as any).mockRejectedValue(new Error('Connection failed'));
        const result = await service.sendOrder({ orderNumber: '123' } as any);
        expect(result).toBe(false);
    });
});
