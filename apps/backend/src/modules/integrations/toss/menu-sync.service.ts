import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TossApiService } from './toss-api.service';

@Injectable()
export class MenuSyncService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tossApiService: TossApiService,
    ) { }

    async testConnection() {
        // 간단한 연결 테스트 로직 (예: 첫 번째 매장 조회 시도)
        // 실제로는 Toss API의 Health Check나 간단한 조회를 수행해야 함
        return { success: true, message: 'Connection test not implemented yet but service is reachable' };
    }

    async syncMenu(storeId: string) {
        // 1. 매장 확인
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            throw new NotFoundException(`Store not found: ${storeId}`);
        }

        // 2. Toss API에서 메뉴 데이터 조회
        const tossData = await this.tossApiService.fetchMenuData(storeId);

        // 3. 트랜잭션으로 동기화 처리
        await this.prisma.$transaction(async (tx) => {
            // --- 카테고리 동기화 ---
            for (const cat of tossData.categories) {
                await tx.menuCategory.upsert({
                    where: {
                        storeId_tossCategoryCode: {
                            storeId,
                            tossCategoryCode: cat.categoryCode,
                        },
                    },
                    update: {
                        name: cat.categoryName,
                        displayOrder: cat.displayOrder,
                    },
                    create: {
                        storeId,
                        tossCategoryCode: cat.categoryCode,
                        name: cat.categoryName,
                        displayOrder: cat.displayOrder,
                    },
                });
            }

            // --- 상품(메뉴) 동기화 ---
            for (const prod of tossData.products) {
                // 카테고리 ID 조회
                const category = await tx.menuCategory.findUnique({
                    where: {
                        storeId_tossCategoryCode: {
                            storeId,
                            tossCategoryCode: prod.categoryCode,
                        },
                    },
                });

                if (!category) continue; // 카테고리가 없으면 스킵

                // 메뉴 Upsert
                const menu = await tx.menu.upsert({
                    where: {
                        storeId_tossMenuCode: {
                            storeId,
                            tossMenuCode: prod.productCode,
                        },
                    },
                    update: {
                        categoryId: category.id,
                        name: prod.productName,
                        price: prod.price,
                        soldOut: prod.soldOut,
                        displayOrder: prod.displayOrder,
                        lastSyncedAt: new Date(),
                    },
                    create: {
                        storeId,
                        categoryId: category.id,
                        tossMenuCode: prod.productCode,
                        name: prod.productName,
                        price: prod.price,
                        soldOut: prod.soldOut,
                        displayOrder: prod.displayOrder,
                        imageUrl: prod.imageUrl,
                    },
                });

                // 옵션 그룹 동기화
                if (prod.optionGroupCodes) {
                    for (const groupCode of prod.optionGroupCodes) {
                        const tossGroup = tossData.optionGroups.find(g => g.groupCode === groupCode);
                        if (!tossGroup) continue;

                        // 그룹 Upsert (이름 기준)
                        let group = await tx.menuOptionGroup.findFirst({
                            where: { menuId: menu.id, name: tossGroup.groupName }
                        });

                        if (!group) {
                            group = await tx.menuOptionGroup.create({
                                data: {
                                    menuId: menu.id,
                                    name: tossGroup.groupName,
                                    minSelect: tossGroup.minSelect,
                                    maxSelect: tossGroup.maxSelect,
                                }
                            });
                        } else {
                            await tx.menuOptionGroup.update({
                                where: { id: group.id },
                                data: {
                                    minSelect: tossGroup.minSelect,
                                    maxSelect: tossGroup.maxSelect,
                                }
                            });
                        }

                        // 옵션 상세 동기화
                        for (const opt of tossGroup.options) {
                            const existingOption = await tx.menuOption.findFirst({
                                where: {
                                    optionGroupId: group.id,
                                    tossOptionCode: opt.optionCode
                                }
                            });

                            if (existingOption) {
                                await tx.menuOption.update({
                                    where: { id: existingOption.id },
                                    data: {
                                        name: opt.optionName,
                                        price: opt.price,
                                        isSoldOut: opt.isSoldOut,
                                    }
                                });
                            } else {
                                await tx.menuOption.create({
                                    data: {
                                        optionGroupId: group.id,
                                        tossOptionCode: opt.optionCode,
                                        name: opt.optionName,
                                        price: opt.price,
                                        isSoldOut: opt.isSoldOut,
                                    }
                                });
                            }
                        }
                    }
                }
            }
        });

        return { success: true, message: 'Menu synced successfully' };
    }
}
