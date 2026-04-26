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
     * 메뉴 목록 조회.
     *
     * 정책: 메뉴는 토스 POS가 single source of truth.
     * tossMenuCode가 없는 레코드는 admin이 직접 만든 잔존 데이터이거나
     * 동기화 누락 항목이므로 고객 노출에서 제외 (배달 주문 불가 메뉴).
     */
    async getMenus(storeId: string, categoryId?: string) {
        const where: any = {
            storeId,
            isActive: true,
            isHidden: false,
            tossMenuCode: { not: null },
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
     * 메뉴 상세 조회. POS sync된 메뉴만 노출.
     */
    async getMenuDetail(menuId: string) {
        const menu = await this.prisma.menu.findUnique({
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

        if (!menu || !menu.tossMenuCode) {
            return null;
        }
        return menu;
    }
}
