import { Injectable, NotFoundException } from '@nestjs/common';
import { assertPlatformAdmin } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateBrandMenuCategoryDto,
    CreateBrandMenuDto,
    UpdateBrandMenuCategoryDto,
    UpdateBrandMenuDto,
} from './dto/brand-menu.dto';

@Injectable()
export class BrandMenusService {
    constructor(private readonly prisma: PrismaService) {}

    private get brandMenuCategory() {
        return (this.prisma as any).brandMenuCategory;
    }

    private get brandMenu() {
        return (this.prisma as any).brandMenu;
    }

    async getPublicCategories() {
        return this.brandMenuCategory.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
            include: {
                menus: {
                    where: { isActive: true },
                    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
                },
            },
        });
    }

    async getPublicMenus(categoryId?: string, featured?: boolean) {
        return this.brandMenu.findMany({
            where: {
                isActive: true,
                ...(categoryId ? { categoryId } : {}),
                ...(featured === undefined ? {} : { isFeatured: featured }),
                category: { isActive: true },
            },
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
            include: { category: true },
        });
    }

    async getAdminCategories(userId: string) {
        await this.assertAdmin(userId);
        return this.brandMenuCategory.findMany({
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
            include: {
                menus: {
                    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
                },
            },
        });
    }

    async createCategory(userId: string, dto: CreateBrandMenuCategoryDto) {
        await this.assertAdmin(userId);
        return this.brandMenuCategory.create({ data: dto });
    }

    async updateCategory(userId: string, categoryId: string, dto: UpdateBrandMenuCategoryDto) {
        await this.assertAdmin(userId);
        await this.ensureCategory(categoryId);
        return this.brandMenuCategory.update({
            where: { id: categoryId },
            data: dto,
        });
    }

    async createMenu(userId: string, dto: CreateBrandMenuDto) {
        await this.assertAdmin(userId);
        await this.ensureCategory(dto.categoryId);
        return this.brandMenu.create({ data: dto });
    }

    async updateMenu(userId: string, menuId: string, dto: UpdateBrandMenuDto) {
        await this.assertAdmin(userId);
        await this.ensureMenu(menuId);
        if (dto.categoryId) {
            await this.ensureCategory(dto.categoryId);
        }
        return this.brandMenu.update({
            where: { id: menuId },
            data: dto,
        });
    }

    async deleteMenu(userId: string, menuId: string) {
        await this.assertAdmin(userId);
        await this.ensureMenu(menuId);
        return this.brandMenu.delete({ where: { id: menuId } });
    }

    private async assertAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });
        assertPlatformAdmin(user);
    }

    private async ensureCategory(categoryId: string) {
        const category = await this.brandMenuCategory.findUnique({
            where: { id: categoryId },
            select: { id: true },
        });
        if (!category) throw new NotFoundException('Brand menu category not found');
    }

    private async ensureMenu(menuId: string) {
        const menu = await this.brandMenu.findUnique({
            where: { id: menuId },
            select: { id: true },
        });
        if (!menu) throw new NotFoundException('Brand menu not found');
    }
}
