import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FranchiseInquiriesService } from './franchise-inquiries.service';

describe('FranchiseInquiriesService', () => {
    let service: FranchiseInquiriesService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            user: {
                findUnique: vi.fn(),
            },
            franchiseInquiry: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
        };
        service = new FranchiseInquiriesService(prisma);
    });

    it('creates a public franchise inquiry', async () => {
        const created = {
            id: 'inquiry-1',
            name: '홍길동',
            phone: '01012345678',
            email: 'hong@example.com',
            area: '서울 강남구',
            message: null,
            isRead: false,
        };
        prisma.franchiseInquiry.create.mockResolvedValue(created);

        const result = await service.create({
            name: '홍길동',
            phone: '01012345678',
            email: 'hong@example.com',
            area: '서울 강남구',
        });

        expect(result).toBe(created);
        expect(prisma.franchiseInquiry.create).toHaveBeenCalledWith({
            data: {
                name: '홍길동',
                phone: '01012345678',
                email: 'hong@example.com',
                area: '서울 강남구',
                message: null,
            },
        });
    });

    it('allows platform admins to list inquiries', async () => {
        prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
        prisma.franchiseInquiry.findMany.mockResolvedValue([{ id: 'inquiry-1' }]);

        const result = await service.findAll('admin-1');

        expect(result).toEqual([{ id: 'inquiry-1' }]);
        expect(prisma.franchiseInquiry.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
        });
    });

    it('blocks store owners from listing inquiries', async () => {
        prisma.user.findUnique.mockResolvedValue({ role: 'OWNER' });

        await expect(service.findAll('owner-1')).rejects.toBeInstanceOf(ForbiddenException);
        expect(prisma.franchiseInquiry.findMany).not.toHaveBeenCalled();
    });

    it('marks an inquiry as read for platform admins', async () => {
        prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
        prisma.franchiseInquiry.findUnique.mockResolvedValue({ id: 'inquiry-1' });
        prisma.franchiseInquiry.update.mockResolvedValue({ id: 'inquiry-1', isRead: true });

        const result = await service.markAsRead('admin-1', 'inquiry-1');

        expect(result).toEqual({ id: 'inquiry-1', isRead: true });
        expect(prisma.franchiseInquiry.update).toHaveBeenCalledWith({
            where: { id: 'inquiry-1' },
            data: { isRead: true },
        });
    });

    it('throws NotFoundException when marking a missing inquiry as read', async () => {
        prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
        prisma.franchiseInquiry.findUnique.mockResolvedValue(null);

        await expect(service.markAsRead('admin-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
        expect(prisma.franchiseInquiry.update).not.toHaveBeenCalled();
    });
});
