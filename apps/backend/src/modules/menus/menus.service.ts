import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
    constructor(private readonly prisma: PrismaService) { }

    async getMenus(storeId: string) {
        // 1. 카테고리 목록 조회 (정렬 순서대로)
        const categories = await this.prisma.menuCategory.findMany({
            where: { storeId },
            orderBy: { displayOrder: 'asc' },
            include: {
                menus: {
                    where: {
                        isActive: true,
                        isHidden: false,
                    },
                    orderBy: { displayOrder: 'asc' },
                    include: {
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
                },
            },
        });

        return categories;
    }
}
