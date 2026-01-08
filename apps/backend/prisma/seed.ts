import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // 0. User 생성 (사장님)
    const user = await prisma.user.upsert({
        where: { id: 'user_123456789' },
        update: {},
        create: {
            id: 'user_123456789', // Mock Supabase UUID
            email: 'owner@example.com',
            name: '홍길동 사장님',
            role: 'OWNER',
        },
    });
    console.log('Created User:', user.name);

    // 1. Store 생성 (타코몰리 김포점)
    const store = await prisma.store.create({
        data: {
            name: '타코몰리 김포점',
            storeType: 'tacomolly',
            branchId: 'gimpo',
            branchName: '김포점',
            type: 'MEXICAN',
            description: '신선한 재료로 만드는 멕시칸 레스토랑',
            okposBranchCode: 'STORE_TACOMOLLY_GIMPO',
            businessHours: { weekday: '11:00-22:00', weekend: '11:00-23:00' },
            theme: { primaryColor: '#FF6B35', logo: 'https://example.com/tacomolly-logo.png' },
            ownerId: user.id,
        },
    });
    console.log('Created Store:', store.name);

    // 2. MenuCategory 생성 (5개 카테고리)
    const categories = await Promise.all([
        prisma.menuCategory.create({
            data: {
                name: '치킨',
                displayOrder: 1,
                storeId: store.id,
                okposCategoryCode: 'CAT_CHICKEN',
            },
        }),
        prisma.menuCategory.create({
            data: {
                name: '피자',
                displayOrder: 2,
                storeId: store.id,
                okposCategoryCode: 'CAT_PIZZA',
            },
        }),
        prisma.menuCategory.create({
            data: {
                name: '파스타',
                displayOrder: 3,
                storeId: store.id,
                okposCategoryCode: 'CAT_PASTA',
            },
        }),
        prisma.menuCategory.create({
            data: {
                name: '음료',
                displayOrder: 4,
                storeId: store.id,
                okposCategoryCode: 'CAT_DRINK',
            },
        }),
        prisma.menuCategory.create({
            data: {
                name: '디저트',
                displayOrder: 5,
                storeId: store.id,
                okposCategoryCode: 'CAT_DESSERT',
            },
        }),
        prisma.menuCategory.create({
            data: {
                name: '직원 호출',
                displayOrder: 6,
                storeId: store.id,
                okposCategoryCode: 'CAT_STAFF_CALL',
            },
        }),
    ]);
    console.log(`Created ${categories.length} Categories`);

    const [chickenCat, pizzaCat, pastaCat, drinkCat, dessertCat, staffCallCat] = categories;

    // 3. 태그 생성
    const bestTag = await prisma.menuTag.create({
        data: {
            storeId: store.id,
            name: 'BEST',
            displayName: '인기',
            icon: '🔥',
            color: '#FF6B35',
            backgroundColor: '#FFF5F2',
        }
    });

    // 4. 치킨 메뉴 생성 (5개)
    const chickenMenus = await Promise.all([
        prisma.menu.create({
            data: {
                name: '후라이드 치킨',
                price: 18000,
                description: '바삭바삭한 클래식 후라이드 치킨',
                categoryId: chickenCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CHICKEN_FRIED',
                displayOrder: 1,
                optionGroups: {
                    create: {
                        name: '사이즈',
                        minSelect: 1,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '1인분', price: 0, displayOrder: 1 },
                                    { name: '2인분', price: 5000, displayOrder: 2 },
                                    { name: '3인분', price: 10000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '양념 치킨',
                price: 19000,
                description: '달콤매콤한 양념 치킨',
                categoryId: chickenCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CHICKEN_SAUCE',
                displayOrder: 2,
                optionGroups: {
                    create: {
                        name: '사이즈',
                        minSelect: 1,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '1인분', price: 0, displayOrder: 1 },
                                    { name: '2인분', price: 5000, displayOrder: 2 },
                                    { name: '3인분', price: 10000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '간장 치킨',
                price: 19000,
                description: '고소한 간장 소스 치킨',
                categoryId: chickenCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CHICKEN_SOY',
                displayOrder: 3,
                optionGroups: {
                    create: {
                        name: '사이즈',
                        minSelect: 1,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '1인분', price: 0, displayOrder: 1 },
                                    { name: '2인분', price: 5000, displayOrder: 2 },
                                    { name: '3인분', price: 10000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '반반 치킨',
                price: 20000,
                description: '후라이드와 양념을 반씩',
                categoryId: chickenCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CHICKEN_HALF',
                displayOrder: 4,
                optionGroups: {
                    create: {
                        name: '사이즈',
                        minSelect: 1,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '1인분', price: 0, displayOrder: 1 },
                                    { name: '2인분', price: 5000, displayOrder: 2 },
                                    { name: '3인분', price: 10000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '허니 치킨',
                price: 20000,
                description: '달콤한 허니 소스 치킨',
                categoryId: chickenCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CHICKEN_HONEY',
                displayOrder: 5,
                soldOut: true, // 품절
                optionGroups: {
                    create: {
                        name: '사이즈',
                        minSelect: 1,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '1인분', price: 0, displayOrder: 1 },
                                    { name: '2인분', price: 5000, displayOrder: 2 },
                                    { name: '3인분', price: 10000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
    ]);
    console.log(`Created ${chickenMenus.length} Chicken Menus`);

    // 5. 피자 메뉴 생성 (5개)
    const pizzaMenus = await Promise.all([
        prisma.menu.create({
            data: {
                name: '마르게리타',
                price: 15000,
                description: '클래식 토마토 & 모짜렐라',
                categoryId: pizzaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PIZZA_MARGHERITA',
                displayOrder: 1,
                optionGroups: {
                    create: [
                        {
                            name: '사이즈',
                            minSelect: 1,
                            maxSelect: 1,
                            displayOrder: 1,
                            options: {
                                createMany: {
                                    data: [
                                        { name: 'R (Regular)', price: 0, displayOrder: 1 },
                                        { name: 'L (Large)', price: 5000, displayOrder: 2 },
                                    ],
                                },
                            },
                        },
                        {
                            name: '추가 토핑',
                            minSelect: 0,
                            maxSelect: 3,
                            displayOrder: 2,
                            options: {
                                createMany: {
                                    data: [
                                        { name: '치즈 추가', price: 2000, displayOrder: 1 },
                                        { name: '페퍼로니 추가', price: 3000, displayOrder: 2 },
                                        { name: '올리브 추가', price: 1500, displayOrder: 3 },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '페퍼로니 피자',
                price: 17000,
                description: '페퍼로니가 가득한 피자',
                categoryId: pizzaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PIZZA_PEPPERONI',
                displayOrder: 2,
                optionGroups: {
                    create: [
                        {
                            name: '사이즈',
                            minSelect: 1,
                            maxSelect: 1,
                            displayOrder: 1,
                            options: {
                                createMany: {
                                    data: [
                                        { name: 'R (Regular)', price: 0, displayOrder: 1 },
                                        { name: 'L (Large)', price: 5000, displayOrder: 2 },
                                    ],
                                },
                            },
                        },
                        {
                            name: '추가 토핑',
                            minSelect: 0,
                            maxSelect: 3,
                            displayOrder: 2,
                            options: {
                                createMany: {
                                    data: [
                                        { name: '치즈 추가', price: 2000, displayOrder: 1 },
                                        { name: '페퍼로니 추가', price: 3000, displayOrder: 2 },
                                        { name: '올리브 추가', price: 1500, displayOrder: 3 },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '불고기 피자',
                price: 18000,
                description: '한국식 불고기 토핑',
                categoryId: pizzaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PIZZA_BULGOGI',
                displayOrder: 3,
                optionGroups: {
                    create: [
                        {
                            name: '사이즈',
                            minSelect: 1,
                            maxSelect: 1,
                            displayOrder: 1,
                            options: {
                                createMany: {
                                    data: [
                                        { name: 'R (Regular)', price: 0, displayOrder: 1 },
                                        { name: 'L (Large)', price: 5000, displayOrder: 2 },
                                    ],
                                },
                            },
                        },
                        {
                            name: '추가 토핑',
                            minSelect: 0,
                            maxSelect: 3,
                            displayOrder: 2,
                            options: {
                                createMany: {
                                    data: [
                                        { name: '치즈 추가', price: 2000, displayOrder: 1 },
                                        { name: '페퍼로니 추가', price: 3000, displayOrder: 2 },
                                        { name: '올리브 추가', price: 1500, displayOrder: 3 },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '콤비네이션 피자',
                price: 19000,
                description: '다양한 토핑이 어우러진 피자',
                categoryId: pizzaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PIZZA_COMBINATION',
                displayOrder: 4,
                optionGroups: {
                    create: [
                        {
                            name: '사이즈',
                            minSelect: 1,
                            maxSelect: 1,
                            displayOrder: 1,
                            options: {
                                createMany: {
                                    data: [
                                        { name: 'R (Regular)', price: 0, displayOrder: 1 },
                                        { name: 'L (Large)', price: 5000, displayOrder: 2 },
                                    ],
                                },
                            },
                        },
                        {
                            name: '추가 토핑',
                            minSelect: 0,
                            maxSelect: 3,
                            displayOrder: 2,
                            options: {
                                createMany: {
                                    data: [
                                        { name: '치즈 추가', price: 2000, displayOrder: 1 },
                                        { name: '페퍼로니 추가', price: 3000, displayOrder: 2 },
                                        { name: '올리브 추가', price: 1500, displayOrder: 3 },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '포테이토 피자',
                price: 17000,
                description: '감자와 베이컨 토핑',
                categoryId: pizzaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PIZZA_POTATO',
                displayOrder: 5,
                optionGroups: {
                    create: [
                        {
                            name: '사이즈',
                            minSelect: 1,
                            maxSelect: 1,
                            displayOrder: 1,
                            options: {
                                createMany: {
                                    data: [
                                        { name: 'R (Regular)', price: 0, displayOrder: 1 },
                                        { name: 'L (Large)', price: 5000, displayOrder: 2 },
                                    ],
                                },
                            },
                        },
                        {
                            name: '추가 토핑',
                            minSelect: 0,
                            maxSelect: 3,
                            displayOrder: 2,
                            options: {
                                createMany: {
                                    data: [
                                        { name: '치즈 추가', price: 2000, displayOrder: 1 },
                                        { name: '페퍼로니 추가', price: 3000, displayOrder: 2 },
                                        { name: '올리브 추가', price: 1500, displayOrder: 3 },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        }),
    ]);
    console.log(`Created ${pizzaMenus.length} Pizza Menus`);

    // 6. 파스타 메뉴 생성 (5개)
    const pastaMenus = await Promise.all([
        prisma.menu.create({
            data: {
                name: '까르보나라',
                price: 12000,
                description: '크림 베이스 베이컨 파스타',
                categoryId: pastaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PASTA_CARBONARA',
                displayOrder: 1,
                optionGroups: {
                    create: {
                        name: '사이드',
                        minSelect: 0,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '없음', price: 0, displayOrder: 1 },
                                    { name: '마늘빵', price: 3000, displayOrder: 2 },
                                    { name: '샐러드', price: 4000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '알리오 올리오',
                price: 11000,
                description: '마늘과 올리브유 파스타',
                categoryId: pastaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PASTA_AGLIO',
                displayOrder: 2,
                optionGroups: {
                    create: {
                        name: '사이드',
                        minSelect: 0,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '없음', price: 0, displayOrder: 1 },
                                    { name: '마늘빵', price: 3000, displayOrder: 2 },
                                    { name: '샐러드', price: 4000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '토마토 파스타',
                price: 11000,
                description: '신선한 토마토 소스',
                categoryId: pastaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PASTA_TOMATO',
                displayOrder: 3,
                optionGroups: {
                    create: {
                        name: '사이드',
                        minSelect: 0,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '없음', price: 0, displayOrder: 1 },
                                    { name: '마늘빵', price: 3000, displayOrder: 2 },
                                    { name: '샐러드', price: 4000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '로제 파스타',
                price: 13000,
                description: '크림과 토마토의 조화',
                categoryId: pastaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PASTA_ROSE',
                displayOrder: 4,
                optionGroups: {
                    create: {
                        name: '사이드',
                        minSelect: 0,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '없음', price: 0, displayOrder: 1 },
                                    { name: '마늘빵', price: 3000, displayOrder: 2 },
                                    { name: '샐러드', price: 4000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
        prisma.menu.create({
            data: {
                name: '해산물 파스타',
                price: 15000,
                description: '신선한 해산물 토핑',
                categoryId: pastaCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_PASTA_SEAFOOD',
                displayOrder: 5,
                optionGroups: {
                    create: {
                        name: '사이드',
                        minSelect: 0,
                        maxSelect: 1,
                        displayOrder: 1,
                        options: {
                            createMany: {
                                data: [
                                    { name: '없음', price: 0, displayOrder: 1 },
                                    { name: '마늘빵', price: 3000, displayOrder: 2 },
                                    { name: '샐러드', price: 4000, displayOrder: 3 },
                                ],
                            },
                        },
                    },
                },
            },
        }),
    ]);
    console.log(`Created ${pastaMenus.length} Pasta Menus`);

    // 7. 음료 메뉴 생성 (5개) - 옵션 없음
    const drinkMenus = await prisma.menu.createMany({
        data: [
            {
                name: '콜라',
                price: 2000,
                description: '시원한 코카콜라',
                categoryId: drinkCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DRINK_COLA',
                displayOrder: 1,
            },
            {
                name: '사이다',
                price: 2000,
                description: '청량한 사이다',
                categoryId: drinkCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DRINK_SPRITE',
                displayOrder: 2,
            },
            {
                name: '오렌지 주스',
                price: 3000,
                description: '100% 오렌지 주스',
                categoryId: drinkCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DRINK_ORANGE',
                displayOrder: 3,
            },
            {
                name: '아메리카노',
                price: 3500,
                description: '진한 아메리카노',
                categoryId: drinkCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DRINK_AMERICANO',
                displayOrder: 4,
            },
            {
                name: '생맥주',
                price: 4500,
                description: '시원한 생맥주',
                categoryId: drinkCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DRINK_BEER',
                displayOrder: 5,
            },
        ],
    });
    console.log(`Created ${drinkMenus.count} Drink Menus`);

    // 8. 디저트 메뉴 생성 (5개) - 옵션 없음
    const dessertMenus = await prisma.menu.createMany({
        data: [
            {
                name: '티라미수',
                price: 6000,
                description: '이탈리안 정통 티라미수',
                categoryId: dessertCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DESSERT_TIRAMISU',
                displayOrder: 1,
            },
            {
                name: '치즈케이크',
                price: 6500,
                description: '부드러운 뉴욕 치즈케이크',
                categoryId: dessertCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DESSERT_CHEESECAKE',
                displayOrder: 2,
            },
            {
                name: '초코 브라우니',
                price: 5000,
                description: '진한 초콜릿 브라우니',
                categoryId: dessertCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DESSERT_BROWNIE',
                displayOrder: 3,
            },
            {
                name: '아이스크림',
                price: 4000,
                description: '바닐라 & 초콜릿',
                categoryId: dessertCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DESSERT_ICECREAM',
                displayOrder: 4,
            },
            {
                name: '과일 샐러드',
                price: 5500,
                description: '신선한 계절 과일',
                categoryId: dessertCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_DESSERT_FRUIT',
                displayOrder: 5,
            },
        ],
    });
    console.log(`Created ${dessertMenus.count} Dessert Menus`);

    // 9. 직원 호출 메뉴 생성 (0원)
    const staffCallMenus = await prisma.menu.createMany({
        data: [
            {
                name: '물',
                price: 0,
                description: '시원한 물을 가져다 드립니다.',
                categoryId: staffCallCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CALL_WATER',
                displayOrder: 1,
            },
            {
                name: '앞치마',
                price: 0,
                description: '일회용 앞치마를 가져다 드립니다.',
                categoryId: staffCallCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CALL_APRON',
                displayOrder: 2,
            },
            {
                name: '물티슈',
                price: 0,
                description: '물티슈를 가져다 드립니다.',
                categoryId: staffCallCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CALL_TISSUE',
                displayOrder: 3,
            },
            {
                name: '직원 호출',
                price: 0,
                description: '기타 도움이 필요하시면 호출해주세요.',
                categoryId: staffCallCat.id,
                storeId: store.id,
                okposMenuCode: 'MENU_CALL_STAFF',
                displayOrder: 4,
            },
        ],
    });
    console.log(`Created ${staffCallMenus.count} Staff Call Menus`);

    console.log('Seeding finished.');
    console.log('총 메뉴 개수: 29개 (기존 25개 + 직원 호출 4개)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
