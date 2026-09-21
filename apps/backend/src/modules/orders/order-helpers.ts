import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

interface OrderItemDto {
    menuId: string;
    quantity: number;
    options?: { optionId?: string }[];
}

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

export async function prepareOrderItems(tx: Prisma.TransactionClient, storeId: string, items: OrderItemDto[]) {
    if (!items?.length) {
        throw new BadRequestException('주문할 메뉴를 한 개 이상 담아 주세요');
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
            // 장바구니에 담은 뒤 메뉴가 삭제·변경됐을 수 있다. 품절과 같은 방식으로
            // menuId를 내려 고객 화면이 해당 메뉴를 장바구니에서 빼도록 한다.
            throw new NotFoundException({
                statusCode: 404,
                code: 'MENU_UNAVAILABLE',
                message: '판매하지 않는 메뉴가 담겨 있습니다. 메뉴가 변경되었을 수 있습니다',
                menuId: itemDto.menuId,
            });
        }
        // isHidden도 함께 막는다. 목록 API는 숨김 메뉴를 빼지만 주문 생성은 걸러내지 않아,
        // menuId만 알면 숨김 메뉴를 주문할 수 있었다(운영에 10원짜리 결제 테스트용 메뉴가 숨김으로 있다).
        if (!menu.isActive || menu.soldOut || menu.isHidden) {
            // 고객 화면은 캐시된 메뉴를 보여주므로 장바구니에 담은 뒤 품절될 수 있다.
            // 어느 메뉴를 빼야 하는지 알려주려고 menuId를 함께 내려준다.
            throw new BadRequestException({
                statusCode: 400,
                code: 'MENU_UNAVAILABLE',
                message: `품절되었거나 판매하지 않는 메뉴입니다: ${menu.name}`,
                menuId: menu.id,
            });
        }

        let itemPrice = menu.price;
        const itemOptionsData = [];

        if (itemDto.options) {
            for (const optDto of itemDto.options) {
                if (!optDto.optionId) {
                    throw new BadRequestException('옵션 정보가 올바르지 않습니다. 메뉴를 다시 담아 주세요');
                }

                const option = menu.optionGroups
                    .flatMap((group) => group.options)
                    .find((candidate) => candidate.id === optDto.optionId);

                if (!option) {
                    throw new NotFoundException('선택한 옵션을 찾을 수 없습니다. 메뉴를 다시 담아 주세요');
                }
                if (option.isSoldOut) {
                    throw new BadRequestException(`품절된 옵션입니다: ${option.name}`);
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

export async function generateOrderNumber(tx: Prisma.TransactionClient, storeId: string): Promise<string> {
    // count 기반 번호 생성은 동시 요청 시 중복 발급 가능.
    // schema에 @@unique([storeId, orderNumber])가 있으므로 충돌 시 Prisma가
    // P2002 에러를 던지고 트랜잭션이 롤백됨 — 중복 저장은 방지됨.
    // 번호 순서 보장이 필요하면 DB 시퀀스로 교체 가능.
    const count = await tx.order.count({
        where: { storeId },
    });
    return String(count + 1).padStart(4, '0');
}
