import { BadRequestException, NotFoundException } from '@nestjs/common';

export function orderInclude() {
    return {
        items: {
            include: {
                selectedOptions: true,
            },
        },
        delivery: true,
        payments: true,
    };
}

export async function prepareOrderItems(tx: any, storeId: string, items: any[]) {
    if (!items?.length) {
        throw new BadRequestException('Order must include at least one item');
    }

    const menuIds = items.map((item) => item.menuId);
    const menus = await tx.menu.findMany({
        where: { id: { in: menuIds }, storeId },
        include: { optionGroups: { include: { options: true } } },
    });

    let totalPrice = 0;
    const orderItemsData = [];

    for (const itemDto of items) {
        const menu = menus.find((m) => m.id === itemDto.menuId);
        if (!menu) {
            throw new NotFoundException(`Menu not found: ${itemDto.menuId}`);
        }
        if (!menu.isActive || menu.soldOut) {
            throw new BadRequestException(`Menu is not available: ${menu.name}`);
        }

        let itemPrice = menu.price;
        const itemOptionsData = [];

        if (itemDto.options) {
            for (const optDto of itemDto.options) {
                if (!optDto.optionId) {
                    throw new BadRequestException('Option ID is required for server-side price validation');
                }

                const option = menu.optionGroups
                    .flatMap((group) => group.options)
                    .find((candidate) => candidate.id === optDto.optionId);

                if (!option) {
                    throw new NotFoundException(`Option not found: ${optDto.optionId}`);
                }
                if (option.isSoldOut) {
                    throw new BadRequestException(`Option is sold out: ${option.name}`);
                }

                itemPrice += option.price;

                const optionGroup = menu.optionGroups.find((group) => group.id === option.optionGroupId);
                itemOptionsData.push({
                    menuOptionGroupId: optionGroup?.id,
                    menuOptionId: option.id,
                    optionGroupName: optionGroup?.name || 'Unknown',
                    optionName: option.name,
                    optionPrice: option.price,
                });
            }
        }

        totalPrice += itemPrice * itemDto.quantity;

        orderItemsData.push({
            menuId: menu.id,
            menuName: menu.name,
            menuPrice: menu.price,
            quantity: itemDto.quantity,
            totalPrice: itemPrice * itemDto.quantity,
            selectedOptions: {
                create: itemOptionsData.map((option) => ({
                    menuOptionGroupId: option.menuOptionGroupId,
                    menuOptionId: option.menuOptionId,
                    optionGroupName: option.optionGroupName,
                    optionName: option.optionName,
                    optionPrice: option.optionPrice,
                })),
            },
        });
    }

    return { totalPrice, orderItemsData };
}

export async function generateOrderNumber(tx: any, storeId: string): Promise<string> {
    // count 기반 번호 생성은 동시 요청 시 중복 발급 가능.
    // schema에 @@unique([storeId, orderNumber])가 있으므로 충돌 시 Prisma가
    // P2002 에러를 던지고 트랜잭션이 롤백됨 — 중복 저장은 방지됨.
    // 번호 순서 보장이 필요하면 DB 시퀀스로 교체 가능.
    const count = await tx.order.count({
        where: { storeId },
    });
    return String(count + 1).padStart(4, '0');
}
