import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService } from './error-logs.service';
import { CreateErrorLogDto } from './dto/create-error-log.dto';

const baseDto = {
    errorCode: 'NETWORK_ERROR',
    message: 'Failed to fetch menu data',
    severity: 'error',
} as CreateErrorLogDto;

describe('ErrorLogsService', () => {
    let prisma: any;
    let service: ErrorLogsService;

    beforeEach(() => {
        prisma = { errorLog: { create: vi.fn().mockResolvedValue({ id: 'log-1' }) } };
        service = new ErrorLogsService(prisma);
    });

    it('DTO의 소문자 severity를 enum 값으로 올려 저장한다', async () => {
        await service.create({ ...baseDto, severity: 'critical' } as CreateErrorLogDto);

        expect(prisma.errorLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ severity: 'CRITICAL' }),
            }),
        );
    });

    it('source는 항상 FRONTEND로 고정한다', async () => {
        // 이 엔드포인트는 프론트 전용이다. 클라이언트가 source를 위조할 수 없어야 한다.
        await service.create({ ...baseDto, source: 'BACKEND' } as any);

        expect(prisma.errorLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ source: 'FRONTEND' }),
            }),
        );
    });

    it('선택 필드가 비면 undefined가 아니라 null로 저장한다', async () => {
        await service.create(baseDto);

        expect(prisma.errorLog.create).toHaveBeenCalledWith({
            data: {
                errorCode: 'NETWORK_ERROR',
                message: 'Failed to fetch menu data',
                severity: 'ERROR',
                source: 'FRONTEND',
                stackTrace: null,
                url: null,
                userAgent: null,
                storeId: null,
                metadata: null,
            },
        });
    });

    it('전달된 선택 필드는 그대로 저장한다', async () => {
        await service.create({
            ...baseDto,
            stackTrace: 'Error: boom',
            url: 'https://delivery.tacomole.kr/menu',
            userAgent: 'Mozilla/5.0',
            storeId: 'store-1',
            metadata: { endpoint: '/api/v1/stores/store-1/menus', statusCode: 500 },
        } as CreateErrorLogDto);

        expect(prisma.errorLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    stackTrace: 'Error: boom',
                    url: 'https://delivery.tacomole.kr/menu',
                    userAgent: 'Mozilla/5.0',
                    storeId: 'store-1',
                    metadata: { endpoint: '/api/v1/stores/store-1/menus', statusCode: 500 },
                }),
            }),
        );
    });
});

describe('ErrorLogsController', () => {
    it('정상 기록되면 success: true를 돌려준다', async () => {
        const service = { create: vi.fn().mockResolvedValue({ id: 'log-1' }) } as unknown as ErrorLogsService;

        await expect(new ErrorLogsController(service).create(baseDto)).resolves.toEqual({ success: true });
    });

    it('기록에 실패해도 예외를 올리지 않는다 — 에러 로깅이 다시 에러를 만들면 무한 루프가 된다', async () => {
        const service = {
            create: vi.fn().mockRejectedValue(new Error('db down')),
        } as unknown as ErrorLogsService;
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        await expect(new ErrorLogsController(service).create(baseDto)).resolves.toEqual({
            success: false,
        });
        expect(consoleError).toHaveBeenCalled();

        consoleError.mockRestore();
    });
});
