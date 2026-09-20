import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, IssueCouponDto, RedeemCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
    constructor(private readonly prisma: PrismaService) {}

    // ────────────────────────────────────────────────────────────────
    // 관리자 전용
    // ────────────────────────────────────────────────────────────────

    async createCoupon(adminId: string, dto: CreateCouponDto) {
        await this.assertAdmin(adminId);

        if (dto.type === CouponType.PERCENTAGE) {
            if (dto.discountValue < 1 || dto.discountValue > 100) {
                throw new BadRequestException('정률 할인은 1~100% 사이여야 합니다');
            }
        }

        return this.prisma.coupon.create({
            data: {
                ...dto,
                maxDiscountAmount: dto.type === CouponType.FIXED_AMOUNT
                    ? null
                    : (dto.maxDiscountAmount ?? 5000),
            },
        });
    }

    async issueCouponToUser(adminId: string, couponId: string, dto: IssueCouponDto) {
        await this.assertAdmin(adminId);

        const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
        if (!coupon || !coupon.isActive) throw new NotFoundException('쿠폰을 찾을 수 없습니다');

        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

        await this.assertIssuable(coupon, dto.userId);

        const expiryDays = dto.expiryDays ?? coupon.defaultExpiryDays;
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

        return this.prisma.userCoupon.create({
            data: { userId: dto.userId, couponId, expiresAt },
            include: { coupon: true },
        });
    }

    async listCoupons(adminId: string) {
        await this.assertAdmin(adminId);
        return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    }

    // ────────────────────────────────────────────────────────────────
    // 사용자 전용
    // ────────────────────────────────────────────────────────────────

    /** 프로모 코드 입력으로 쿠폰 발급 */
    async redeemCode(userId: string, dto: RedeemCouponDto) {
        const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
        if (!coupon || !coupon.isActive) throw new NotFoundException('유효하지 않은 쿠폰 코드입니다');

        await this.assertIssuable(coupon, userId);

        const expiresAt = new Date(Date.now() + coupon.defaultExpiryDays * 24 * 60 * 60 * 1000);

        return this.prisma.userCoupon.create({
            data: { userId, couponId: coupon.id, expiresAt },
            include: { coupon: true },
        });
    }

    /** 사용 가능한 내 쿠폰 목록 (미사용 + 미만료) */
    async getMyAvailableCoupons(userId: string) {
        return this.prisma.userCoupon.findMany({
            where: {
                userId,
                isUsed: false,
                expiresAt: { gt: new Date() },
                coupon: { isActive: true },
            },
            include: { coupon: true },
            orderBy: { expiresAt: 'asc' },
        });
    }

    /** 전체 내 쿠폰 목록 (사용/만료 포함) */
    async getMyCoupons(userId: string) {
        return this.prisma.userCoupon.findMany({
            where: { userId },
            include: { coupon: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ────────────────────────────────────────────────────────────────
    // 주문 내부 사용 (OrdersService에서 호출)
    // ────────────────────────────────────────────────────────────────

    /**
     * 쿠폰 유효성 검증 후 할인 금액 계산.
     * 실제 mark-as-used는 주문 생성 트랜잭션 내에서 호출.
     */
    async validateAndCalculateDiscount(
        userId: string,
        userCouponId: string,
        orderAmount: number,
    ): Promise<{ discountAmount: number; userCoupon: any }> {
        const userCoupon = await this.prisma.userCoupon.findUnique({
            where: { id: userCouponId },
            include: { coupon: true },
        });

        if (!userCoupon || userCoupon.userId !== userId) {
            throw new NotFoundException('쿠폰을 찾을 수 없습니다');
        }
        if (userCoupon.isUsed) throw new BadRequestException('이미 사용된 쿠폰입니다');
        if (userCoupon.expiresAt < new Date()) throw new BadRequestException('만료된 쿠폰입니다');
        if (!userCoupon.coupon.isActive) throw new BadRequestException('비활성화된 쿠폰입니다');

        const { coupon } = userCoupon;
        if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
            throw new BadRequestException(
                `최소 주문금액 ${coupon.minOrderAmount.toLocaleString()}원 이상일 때 사용 가능합니다`,
            );
        }

        let discountAmount: number;
        if (coupon.type === CouponType.PERCENTAGE) {
            discountAmount = Math.floor((orderAmount * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount !== null) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
            }
        } else {
            discountAmount = Math.min(coupon.discountValue, orderAmount);
        }

        return { discountAmount, userCoupon };
    }

    /** 주문 트랜잭션 내에서 쿠폰 사용 처리 */
    async markAsUsed(tx: any, userCouponId: string, orderId: string) {
        await tx.userCoupon.update({
            where: { id: userCouponId },
            data: { isUsed: true, usedAt: new Date() },
        });
        await tx.coupon.update({
            where: { id: (await tx.userCoupon.findUnique({ where: { id: userCouponId }, select: { couponId: true } })).couponId },
            data: { usedCount: { increment: 1 } },
        });
    }

    // ────────────────────────────────────────────────────────────────
    // 내부 유틸
    // ────────────────────────────────────────────────────────────────

    /**
     * 쿠폰을 한 사람에게 더 발급해도 되는지 검사한다. (관리자 직접 발급 / 프로모 코드 등록 공용)
     *
     * maxUses는 스키마상 "총 발급 한도"이므로 이미 발급된 UserCoupon 수를 기준으로 본다.
     * (예전에는 usedCount 즉 "실제 결제에 사용된 수"를 봐서, 발급만 하고 안 쓰면 한도가
     *  올라가지 않아 한도를 훨씬 넘겨 발급될 수 있었다.)
     *
     * 동시 요청이 겹치면 한도를 1~2장 넘길 수 있다. 예산 통제 목적에는 충분하다고 보고
     * 별도 잠금은 두지 않는다. 엄격히 막아야 하면 발급 수 컬럼 + 조건부 증가가 필요하다.
     */
    private async assertIssuable(
        coupon: { id: string; maxUses: number | null },
        userId: string,
    ) {
        const already = await this.prisma.userCoupon.findUnique({
            where: { userId_couponId: { userId, couponId: coupon.id } },
        });
        if (already) throw new BadRequestException('이미 보유한 쿠폰입니다');

        if (coupon.maxUses !== null) {
            const issuedCount = await this.prisma.userCoupon.count({
                where: { couponId: coupon.id },
            });
            if (issuedCount >= coupon.maxUses) {
                throw new BadRequestException('발급 한도가 초과된 쿠폰입니다');
            }
        }
    }

    private async assertAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (!user || user.role !== 'ADMIN') throw new ForbiddenException('관리자만 접근할 수 있습니다');
    }
}
