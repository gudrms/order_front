import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * 카테고리 목록 조회 (메뉴 포함하지 않음)
     */
    async getCategories(storeId: string) {
        return this.prisma.menuCategory.findMany({
            where: { storeId },
            orderBy: { displayOrder: 'asc' },
        });
    }

    /**
     * 메뉴 목록 조회
     */
    async getMenus(storeId: string, categoryId?: string) {
        const where: any = {
            storeId,
            isActive: true,
            isHidden: false,
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        return this.prisma.menu.findMany({
            where,
            orderBy: { displayOrder: 'asc' },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                optionGroups: {
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        options: {
                            orderBy: { displayOrder: 'asc' },
                        },
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
    }

    /**
     * 메뉴 상세 조회
     */
    async getMenuDetail(menuId: string) {
        return this.prisma.menu.findUnique({
            where: { id: menuId },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                optionGroups: {
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        options: {
                            orderBy: { displayOrder: 'asc' },
                        },
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
    }
}
