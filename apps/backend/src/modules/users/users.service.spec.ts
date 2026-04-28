import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;
    let prisma: any;
    let tx: any;

    const user = {
        id: 'user-1',
        email: 'user@example.com',
        userMetadata: {
            name: '테스트 고객',
            phone: '010-1234-5678',
        },
    };

    beforeEach(() => {
        tx = {
            userAddress: {
                count: vi.fn(),
                updateMany: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                findFirst: vi.fn(),
            },
        };
        prisma = {
            user: {
                upsert: vi.fn(),
            },
            userAddress: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
            },
            userFavorite: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                create: vi.fn(),
                delete: vi.fn(),
            },
            $transaction: vi.fn((callback) => callback(tx)),
        };

        service = new UsersService(prisma);
    });

    it('인증 사용자 정보가 없으면 주소 생성을 거부한다', async () => {
        await expect(service.createAddress({ id: '' }, {
            name: '집',
            address: '서울',
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(prisma.user.upsert).not.toHaveBeenCalled();
    });

    it('첫 주소는 기본 주소로 생성한다', async () => {
        prisma.user.upsert.mockResolvedValue(user);
        tx.userAddress.count.mockResolvedValue(0);
        tx.userAddress.create.mockResolvedValue({
            id: 'addr-1',
            userId: user.id,
            name: '집',
            address: '서울',
            isDefault: true,
        });

        const result = await service.createAddress(user, {
            name: '집',
            address: '서울',
        });

        expect(tx.userAddress.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: user.id,
                name: '집',
                address: '서울',
                isDefault: true,
            }),
        });
        expect(result.isDefault).toBe(true);
    });

    it('기본 주소로 생성하면 기존 기본 주소를 해제한다', async () => {
        prisma.user.upsert.mockResolvedValue(user);
        tx.userAddress.count.mockResolvedValue(2);
        tx.userAddress.create.mockResolvedValue({
            id: 'addr-2',
            userId: user.id,
            name: '회사',
            address: '서울',
            isDefault: true,
        });

        await service.createAddress(user, {
            name: '회사',
            address: '서울',
            isDefault: true,
        });

        expect(tx.userAddress.updateMany).toHaveBeenCalledWith({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false },
        });
    });

    it('다른 사용자의 주소 수정은 찾을 수 없음으로 처리한다', async () => {
        prisma.userAddress.findUnique.mockResolvedValue({
            id: 'addr-1',
            userId: 'other-user',
        });

        await expect(service.updateAddress(user.id, 'addr-1', {
            name: '새 이름',
        })).rejects.toBeInstanceOf(NotFoundException);

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('기본 주소 삭제 시 남은 최신 주소를 기본 주소로 승격한다', async () => {
        prisma.userAddress.findUnique.mockResolvedValue({
            id: 'addr-1',
            userId: user.id,
            isDefault: true,
        });
        tx.userAddress.delete.mockResolvedValue({
            id: 'addr-1',
            userId: user.id,
            isDefault: true,
        });
        tx.userAddress.findFirst.mockResolvedValue({
            id: 'addr-2',
            userId: user.id,
            isDefault: false,
        });

        await service.deleteAddress(user.id, 'addr-1');

        expect(tx.userAddress.update).toHaveBeenCalledWith({
            where: { id: 'addr-2' },
            data: { isDefault: true },
        });
    });
});
