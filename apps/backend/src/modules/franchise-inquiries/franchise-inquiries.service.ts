import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFranchiseInquiryDto } from './dto/create-franchise-inquiry.dto';

@Injectable()
export class FranchiseInquiriesService {
    constructor(private readonly prisma: PrismaService) {}

    /** 창업 문의 저장 (공개) */
    async create(dto: CreateFranchiseInquiryDto) {
        return this.prisma.franchiseInquiry.create({
            data: {
                name: dto.name,
                phone: dto.phone,
                email: dto.email,
                area: dto.area,
                message: dto.message ?? null,
            },
        });
    }

    /** 창업 문의 목록 조회 — 최신순 (관리자) */
    async findAll(adminId: string) {
        await this.assertAdmin(adminId);

        return this.prisma.franchiseInquiry.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    /** 읽지 않은 문의 수 */
    async countUnread(adminId: string): Promise<number> {
        await this.assertAdmin(adminId);

        return this.prisma.franchiseInquiry.count({
            where: { isRead: false },
        });
    }

    /** 읽음 처리 */
    async markAsRead(adminId: string, id: string) {
        await this.assertAdmin(adminId);

        const inquiry = await this.prisma.franchiseInquiry.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!inquiry) {
            throw new NotFoundException('창업 문의를 찾을 수 없습니다');
        }

        return this.prisma.franchiseInquiry.update({
            where: { id },
            data: { isRead: true },
        });
    }

    private async assertAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user || user.role !== 'ADMIN') {
            throw new ForbiddenException('관리자만 접근할 수 있습니다');
        }
    }
}
