import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { PrismaService } from '../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MenusService', () => {
    let service: MenusService;
    let prisma: PrismaService;

    const mockPrismaService = {
        menuCategory: {
            findMany: vi.fn(),
        },
        menu: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
    };

    beforeEach(async () => {
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
                { id: 'menu-1', name: 'Menu 1', categoryId: 'cat-1' },
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
    });

    describe('getMenuDetail', () => {
        it('should return menu detail for a given menuId', async () => {
            const menuId = 'menu-1';
            const expectedMenu = { id: 'menu-1', name: 'Menu 1', optionGroups: [] };

            vi.spyOn(prisma.menu, 'findUnique').mockResolvedValue(expectedMenu as any);

            const result = await service.getMenuDetail(menuId);

            expect(result).toEqual(expectedMenu);
            expect(prisma.menu.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: menuId },
            }));
        });
    });
});
