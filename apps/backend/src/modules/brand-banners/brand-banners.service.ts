import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { assertPlatformAdmin } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateBrandBannerDto, UpdateBrandBannerDto } from './dto/brand-banner.dto';
import { revalidateDeliveryCache } from '../../common/utils/delivery-cache';

@Injectable()
export class BrandBannersService {
    private readonly logger = new Logger(BrandBannersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    private get brandBanner() {
        return this.prisma.brandBanner;
    }

    async getPublicBanners() {
        return this.brandBanner.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }

    async getAdminBanners(userId: string) {
        await this.assertAdmin(userId);
        return this.brandBanner.findMany({
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }

    async createBanner(userId: string, dto: CreateBrandBannerDto) {
        await this.assertAdmin(userId);
        const banner = await this.brandBanner.create({ data: dto });
        await revalidateDeliveryCache({ tags: ['delivery:banners'] }, this.logger);
        return banner;
    }

    async updateBanner(userId: string, bannerId: string, dto: UpdateBrandBannerDto) {
        await this.assertAdmin(userId);
        await this.ensureBanner(bannerId);
        const banner = await this.brandBanner.update({
            where: { id: bannerId },
            data: dto,
        });
        await revalidateDeliveryCache({ tags: ['delivery:banners'] }, this.logger);
        return banner;
    }

    async deleteBanner(userId: string, bannerId: string) {
        await this.assertAdmin(userId);
        await this.ensureBanner(bannerId);
        const banner = await this.brandBanner.delete({ where: { id: bannerId } });
        await revalidateDeliveryCache({ tags: ['delivery:banners'] }, this.logger);
        return banner;
    }

    async uploadBannerImage(
        userId: string,
        file: { buffer: Buffer; mimetype: string; size: number } | undefined,
    ) {
        await this.assertAdmin(userId);

        if (!file) {
            throw new BadRequestException('이미지 파일을 선택해 주세요');
        }
        if (!this.storage.isSupportedImageType(file.mimetype)) {
            throw new BadRequestException('지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 업로드할 수 있습니다');
        }

        const imageUrl = await this.storage.uploadBrandBannerImage(file);
        return { imageUrl };
    }

    private async assertAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });
        assertPlatformAdmin(user);
    }

    private async ensureBanner(bannerId: string) {
        const banner = await this.brandBanner.findUnique({
            where: { id: bannerId },
            select: { id: true },
        });
        if (!banner) throw new NotFoundException('배너를 찾을 수 없습니다');
    }
}
