import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FranchiseInquiryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFranchiseInquiryDto, UpdateFranchiseInquiryDto } from './dto/franchise-inquiry.dto';

@Injectable()
export class FranchiseInquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFranchiseInquiryDto) {
    return this.prisma.franchiseInquiry.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        email: dto.email.trim().toLowerCase(),
        area: dto.area.trim(),
        message: dto.message?.trim() || null,
      },
    });
  }

  async findAll(userId: string, status?: FranchiseInquiryStatus) {
    await this.assertPlatformAdmin(userId);

    return this.prisma.franchiseInquiry.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async update(userId: string, inquiryId: string, dto: UpdateFranchiseInquiryDto) {
    await this.assertPlatformAdmin(userId);

    const existing = await this.prisma.franchiseInquiry.findUnique({
      where: { id: inquiryId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('가맹 문의를 찾을 수 없습니다');
    }

    return this.prisma.franchiseInquiry.update({
      where: { id: inquiryId },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.adminNote !== undefined && { adminNote: dto.adminNote.trim() || null }),
      },
    });
  }

  private async assertPlatformAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('가맹 문의는 마스터 관리자만 관리할 수 있습니다');
    }
  }
}
