import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { PrismaService } from '../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuManagementMode } from '@prisma/client';

describe('MenusService', () => {
    let service: MenusService;
    let prisma: PrismaService;

    const owner = { id: 'owner-1', role: 'OWNER' };
    const adminDirectStore = { id: 'store-1', ownerId: 'owner-1', menuManagementMode: MenuManagementMode.ADMIN_DIRECT };
    const tossPosStore = { id: 'store-1', ownerId: 'owner-1', menuManagementMode: MenuManagementMode.TOSS_POS };

    const mockPrismaService = {
        menuCategory: {
            findMany: vi.fn(),
            create: vi.fn(),
        },
        menu: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        menuOptionGroup: {
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        menuOption: {
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        store: {
            findUnique: vi.fn(),
        },
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        mockPrismaService.store.findUnique.mockResolvedValue(tossPosStore);
        mockPrismaService.user.findUnique.mockResolvedValue(owner);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MenusService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<MenusService>(MenusService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getCategories', () => {
        it('should return categories for a given storeId', async () => {
            const storeId = 'store-1';
            const expectedCategories = [
                { id: 'cat-1', name: 'Category 1', displayOrder: 1 },
            ];

            vi.spyOn(prisma.menuCategory, 'findMany').mockResolvedValue(expectedCategories as any);

            const result = await service.getCategories(storeId);

            expect(result).toEqual(expectedCategories);
            expect(prisma.menuCategory.findMany).toHaveBeenCalledWith({
                where: { storeId },
                orderBy: { displayOrder: 'asc' },
            });
        });
    });

    describe('getMenus', () => {
        it('should return menus for a given storeId', async () => {
            const storeId = 'store-1';
            const expectedMenus = [
                { id: 'menu-1', name: 'Menu 1', categoryId: 'cat-1', tossMenuCode: '101' },
            ];

            vi.spyOn(prisma.menu, 'findMany').mockResolvedValue(expectedMenus as any);

            const result = await service.getMenus(storeId);

            expect(result).toEqual(expectedMenus);
            expect(prisma.menu.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ storeId }),
            }));
        });

        it('should filter menus by categoryId if provided', async () => {
            const storeId = 'store-1';
            const categoryId = 'cat-1';

            await service.getMenus(storeId, categoryId);

            expect(prisma.menu.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ storeId, categoryId }),
            }));
        });

        it('excludes admin-only menus that lack a tossMenuCode (POS as source of truth)', async () => {
            await service.getMenus('store-1');

            expect(prisma.menu.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ tossMenuCode: { not: null } }),
            }));
        });
    });

    describe('getMenuDetail', () => {
        it('should return menu detail when the menu has a tossMenuCode (POS-synced)', async () => {
            const menuId = 'menu-1';
            const expectedMenu = { id: 'menu-1', name: 'Menu 1', tossMenuCode: '101', optionGroups: [] };

            vi.spyOn(prisma.menu, 'findUnique').mockResolvedValue(expectedMenu as any);

            const result = await service.getMenuDetail(menuId);

            expect(result).toEqual(expectedMenu);
            expect(prisma.menu.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: menuId },
            }));
        });

        it('returns null for admin-only menus without tossMenuCode (POS as source of truth)', async () => {
            const adminOnlyMenu = { id: 'menu-2', name: 'Admin Only', tossMenuCode: null, optionGroups: [] };
            vi.spyOn(prisma.menu, 'findUnique').mockResolvedValue(adminOnlyMenu as any);

            const result = await service.getMenuDetail('menu-2');

            expect(result).toBeNull();
        });
    });

    describe('createCategory', () => {
        it('creates a category when store is in ADMIN_DIRECT mode', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(adminDirectStore);
            mockPrismaService.menuCategory.create.mockResolvedValue({ id: 'cat-new', name: '신메뉴', displayOrder: 1 });

            const result = await service.createCategory('owner-1', 'store-1', { name: '신메뉴', displayOrder: 1 });

            expect(result).toEqual(expect.objectContaining({ name: '신메뉴' }));
            expect(mockPrismaService.menuCategory.create).toHaveBeenCalledWith({
                data: { storeId: 'store-1', name: '신메뉴', displayOrder: 1 },
            });
        });

        it('rejects category creation when store is in TOSS_POS mode', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(tossPosStore);

            await expect(service.createCategory('owner-1', 'store-1', { name: '신메뉴' }))
                .rejects.toBeInstanceOf(BadRequestException);

            expect(mockPrismaService.menuCategory.create).not.toHaveBeenCalled();
        });
    });

    describe('createMenu', () => {
        it('creates a menu when store is in ADMIN_DIRECT mode and category exists', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(adminDirectStore);
            (prisma.menuCategory as any).findFirst = vi.fn().mockResolvedValue({ id: 'cat-1' });
            mockPrismaService.menu.create.mockResolvedValue({ id: 'menu-new', name: '타코', price: 8000 });

            const result = await service.createMenu('owner-1', 'store-1', {
                categoryId: 'cat-1',
                name: '타코',
                price: 8000,
            });

            expect(result).toEqual(expect.objectContaining({ name: '타코', price: 8000 }));
        });

        it('rejects menu creation when category does not belong to the store', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(adminDirectStore);
            (prisma.menuCategory as any).findFirst = vi.fn().mockResolvedValue(null);

            await expect(service.createMenu('owner-1', 'store-1', {
                categoryId: 'nonexistent-cat',
                name: '타코',
                price: 8000,
            })).rejects.toBeInstanceOf(NotFoundException);

            expect(mockPrismaService.menu.create).not.toHaveBeenCalled();
        });

        it('rejects menu creation when store is in TOSS_POS mode', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(tossPosStore);

            await expect(service.createMenu('owner-1', 'store-1', {
                categoryId: 'cat-1',
                name: '타코',
                price: 8000,
            })).rejects.toBeInstanceOf(BadRequestException);
        });
    });

    describe('createOptionGroup', () => {
        it('creates an option group for an existing menu', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(adminDirectStore);
            mockPrismaService.menu.findFirst.mockResolvedValue({ id: 'menu-1', storeId: 'store-1' });
            mockPrismaService.menuOptionGroup.create.mockResolvedValue({ id: 'grp-1', name: '맵기 선택', minSelect: 1, maxSelect: 1 });

            const result = await service.createOptionGroup('owner-1', 'store-1', 'menu-1', {
                name: '맵기 선택',
                minSelect: 1,
                maxSelect: 1,
            });

            expect(result).toEqual(expect.objectContaining({ name: '맵기 선택' }));
        });

        it('throws not found when the target menu does not exist', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(adminDirectStore);
            mockPrismaService.menu.findFirst.mockResolvedValue(null);

            await expect(service.createOptionGroup('owner-1', 'store-1', 'nonexistent', {
                name: '맵기 선택',
                minSelect: 1,
                maxSelect: 1,
            })).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('deleteOptionGroup', () => {
        it('deletes an option group that belongs to the store menu', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(adminDirectStore);
            mockPrismaService.menuOptionGroup.findFirst.mockResolvedValue({ id: 'grp-1' });
            mockPrismaService.menuOptionGroup.delete.mockResolvedValue({ id: 'grp-1' });

            await service.deleteOptionGroup('owner-1', 'store-1', 'menu-1', 'grp-1');

            expect(mockPrismaService.menuOptionGroup.delete).toHaveBeenCalledWith({ where: { id: 'grp-1' } });
        });

        it('throws not found when the option group does not belong to the menu', async () => {
            mockPrismaService.store.findUnique.mockResolvedValue(adminDirectStore);
            mockPrismaService.menuOptionGroup.findFirst.mockResolvedValue(null);

            await expect(service.deleteOptionGroup('owner-1', 'store-1', 'menu-1', 'nonexistent'))
                .rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
