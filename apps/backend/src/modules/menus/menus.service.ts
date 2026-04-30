import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MenuManagementMode } from '@prisma/client';
import { assertCanManageStore } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateMenuCategoryDto,
    CreateMenuDto,
    CreateMenuOptionDto,
    CreateOptionGroupDto,
    UpdateMenuDto,
    UpdateMenuOptionDto,
    UpdateOptionGroupDto,
} from './dto/menu-admin.dto';

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
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { menuManagementMode: true },
        });

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        const where: any = {
            storeId,
            isActive: true,
            isHidden: false,
        };

        if (store.menuManagementMode === MenuManagementMode.TOSS_POS) {
            where.tossMenuCode = { not: null };
        }

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

        if (!menu) {
            return null;
        }

        const store = await this.prisma.store.findUnique({
            where: { id: menu.storeId },
            select: { menuManagementMode: true },
        });

        if (store?.menuManagementMode === MenuManagementMode.TOSS_POS && !menu.tossMenuCode) {
            return null;
        }
        return menu;
    }

    async createCategory(userId: string, storeId: string, dto: CreateMenuCategoryDto) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);

        return this.prisma.menuCategory.create({
            data: {
                storeId,
                name: dto.name,
                displayOrder: dto.displayOrder ?? 0,
            },
        });
    }

    async getAdminMenus(userId: string, storeId: string, categoryId?: string) {
        await this.assertCanManageStore(userId, storeId);

        const where: any = {
            storeId,
            isActive: true,
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

    async createMenu(userId: string, storeId: string, dto: CreateMenuDto) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);

        const category = await this.prisma.menuCategory.findFirst({
            where: { id: dto.categoryId, storeId },
            select: { id: true },
        });

        if (!category) {
            throw new NotFoundException('Menu category not found');
        }

        return this.prisma.menu.create({
            data: {
                storeId,
                categoryId: dto.categoryId,
                name: dto.name,
                price: dto.price,
                description: dto.description,
                imageUrl: dto.imageUrl,
                displayOrder: dto.displayOrder ?? 0,
                soldOut: dto.soldOut ?? false,
                isHidden: dto.isHidden ?? false,
            },
            include: {
                category: { select: { id: true, name: true } },
                optionGroups: { include: { options: true } },
                tags: { include: { tag: true } },
            },
        });
    }

    async updateMenu(userId: string, storeId: string, menuId: string, dto: UpdateMenuDto) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);

        const menu = await this.prisma.menu.findFirst({
            where: { id: menuId, storeId },
            select: { id: true, tossMenuCode: true },
        });

        if (!menu) {
            throw new NotFoundException('Menu not found');
        }

        if (menu.tossMenuCode) {
            throw new BadRequestException('Toss POS synced menus must be edited in Toss POS');
        }

        if (dto.categoryId) {
            const category = await this.prisma.menuCategory.findFirst({
                where: { id: dto.categoryId, storeId },
                select: { id: true },
            });
            if (!category) {
                throw new NotFoundException('Menu category not found');
            }
        }

        return this.prisma.menu.update({
            where: { id: menuId },
            data: dto,
            include: {
                category: { select: { id: true, name: true } },
                optionGroups: { include: { options: true } },
                tags: { include: { tag: true } },
            },
        });
    }

    async createOptionGroup(userId: string, storeId: string, menuId: string, dto: CreateOptionGroupDto) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);
        const menu = await this.prisma.menu.findFirst({
            where: { id: menuId, storeId },
            select: { id: true, tossMenuCode: true },
        });
        if (!menu) throw new NotFoundException('Menu not found');
        if (menu.tossMenuCode) throw new BadRequestException('Toss POS synced menus must be edited in Toss POS');

        return this.prisma.menuOptionGroup.create({
            data: {
                menuId,
                name: dto.name,
                minSelect: dto.minSelect ?? 0,
                maxSelect: dto.maxSelect ?? 1,
                displayOrder: dto.displayOrder ?? 0,
            },
            include: { options: { orderBy: { displayOrder: 'asc' } } },
        });
    }

    async updateOptionGroup(userId: string, storeId: string, menuId: string, groupId: string, dto: UpdateOptionGroupDto) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);
        const group = await this.prisma.menuOptionGroup.findFirst({
            where: { id: groupId, menuId, menu: { storeId } },
        });
        if (!group) throw new NotFoundException('Option group not found');

        return this.prisma.menuOptionGroup.update({
            where: { id: groupId },
            data: dto,
            include: { options: { orderBy: { displayOrder: 'asc' } } },
        });
    }

    async deleteOptionGroup(userId: string, storeId: string, menuId: string, groupId: string) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);
        const group = await this.prisma.menuOptionGroup.findFirst({
            where: { id: groupId, menuId, menu: { storeId } },
        });
        if (!group) throw new NotFoundException('Option group not found');

        await this.prisma.menuOptionGroup.delete({ where: { id: groupId } });
    }

    async createOption(userId: string, storeId: string, menuId: string, groupId: string, dto: CreateMenuOptionDto) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);
        const group = await this.prisma.menuOptionGroup.findFirst({
            where: { id: groupId, menuId, menu: { storeId } },
        });
        if (!group) throw new NotFoundException('Option group not found');

        return this.prisma.menuOption.create({
            data: {
                optionGroupId: groupId,
                name: dto.name,
                price: dto.price,
                displayOrder: dto.displayOrder ?? 0,
                isSoldOut: dto.isSoldOut ?? false,
            },
        });
    }

    async updateOption(userId: string, storeId: string, menuId: string, groupId: string, optionId: string, dto: UpdateMenuOptionDto) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);
        const option = await this.prisma.menuOption.findFirst({
            where: { id: optionId, optionGroupId: groupId, optionGroup: { menuId, menu: { storeId } } },
        });
        if (!option) throw new NotFoundException('Option not found');
        if (option.tossOptionCode) throw new BadRequestException('Toss POS synced options must be edited in Toss POS');

        return this.prisma.menuOption.update({ where: { id: optionId }, data: dto });
    }

    async deleteOption(userId: string, storeId: string, menuId: string, groupId: string, optionId: string) {
        await this.assertCanManageAdminDirectMenus(userId, storeId);
        const option = await this.prisma.menuOption.findFirst({
            where: { id: optionId, optionGroupId: groupId, optionGroup: { menuId, menu: { storeId } } },
        });
        if (!option) throw new NotFoundException('Option not found');
        if (option.tossOptionCode) throw new BadRequestException('Toss POS synced options must be edited in Toss POS');

        await this.prisma.menuOption.delete({ where: { id: optionId } });
    }

    private async assertCanManageStore(userId: string, storeId: string) {
        const [user, store] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.store.findUnique({ where: { id: storeId } }),
        ]);

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        assertCanManageStore(user, store);

        return store;
    }

    private async assertCanManageAdminDirectMenus(userId: string, storeId: string) {
        const store = await this.assertCanManageStore(userId, storeId);

        if (store.menuManagementMode !== MenuManagementMode.ADMIN_DIRECT) {
            throw new BadRequestException('Direct menu editing is available only in ADMIN_DIRECT mode');
        }

        return store;
    }
}
