"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding data...');
    const user = await prisma.user.upsert({
        where: { id: 'user_123456789' },
        update: {},
        create: {
            id: 'user_123456789',
            email: 'owner@example.com',
            name: '홍길동 사장님',
            role: 'OWNER',
        },
    });
    console.log('Created User:', user.name);
    const store = await prisma.store.create({
        data: {
            name: '맛있는 중국집 김포점',
            storeType: 'chinese',
            branchId: 'gimpo',
            branchName: '김포점',
            type: 'CHINESE',
            description: '정통 중화요리 전문점',
            okposBranchCode: 'STORE_001',
            businessHours: { weekday: '10:00-22:00', weekend: '10:00-23:00' },
            theme: { primaryColor: '#E74C3C', logo: 'https://example.com/logo.png' },
            ownerId: user.id,
        },
    });
    console.log('Created Store:', store.name);
    const category = await prisma.menuCategory.create({
        data: {
            name: '식사류',
            displayOrder: 1,
            storeId: store.id,
            okposCategoryCode: 'CAT_001',
        },
    });
    console.log('Created Category:', category.name);
    const menu = await prisma.menu.create({
        data: {
            name: '짜장면',
            price: 7000,
            description: '춘장의 깊은 맛이 살아있는 정통 짜장면',
            categoryId: category.id,
            storeId: store.id,
            okposMenuCode: 'MENU_001',
            imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=500&auto=format&fit=crop',
            tags: {
                create: [
                    {
                        tag: {
                            create: {
                                storeId: store.id,
                                name: 'BEST',
                                displayName: '인기',
                                icon: '🔥',
                            }
                        }
                    }
                ]
            }
        },
    });
    console.log('Created Menu:', menu.name);
    const sizeGroup = await prisma.menuOptionGroup.create({
        data: {
            name: '사이즈 선택',
            minSelect: 1,
            maxSelect: 1,
            menuId: menu.id,
        },
    });
    await prisma.menuOption.createMany({
        data: [
            {
                name: '보통',
                price: 0,
                optionGroupId: sizeGroup.id,
                okposOptionCode: 'OPT_001',
            },
            {
                name: '곱배기',
                price: 1000,
                optionGroupId: sizeGroup.id,
                okposOptionCode: 'OPT_002',
            },
        ],
    });
    console.log('Created Options for:', sizeGroup.name);
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map