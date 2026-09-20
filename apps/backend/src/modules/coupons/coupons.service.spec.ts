import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { CouponsService } from './coupons.service';

const mockPrisma = {
    user: { findUnique: vi.fn() },
    coupon: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    userCoupon: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
};

const adminUser = { id: 'admin-1', role: 'ADMIN' };
const regularUser = { id: 'user-1', role: 'USER' };

const percentageCoupon = {
    id: 'coupon-1',
    code: 'PERCENT10',
    type: CouponType.PERCENTAGE,
    discountValue: 10,
    maxDiscountAmount: 5000,
    minOrderAmount: null,
    isActive: true,
    maxUses: null,
    usedCount: 0,
    defaultExpiryDays: 30,
};

const fixedCoupon = {
    id: 'coupon-2',
    code: 'FIXED3000',
    type: CouponType.FIXED_AMOUNT,
    discountValue: 3000,
    maxDiscountAmount: null,
    minOrderAmount: 10000,
    isActive: true,
    maxUses: 5,
    usedCount: 3,
    defaultExpiryDays: 30,
};

describe('CouponsService', () => {
    let service: CouponsService;

    beforeEach(() => {
        vi.clearAllMocks();
        // 발급 한도는 이미 발급된 수를 기준으로 판정한다. 별도 지정이 없으면 0장 발급 상태.
        mockPrisma.userCoupon.count.mockResolvedValue(0);
        service = new CouponsService(mockPrisma as any);
    });

    // ─── Admin: createCoupon ───────────────────────────────────────────

    describe('createCoupon', () => {
        it('관리자가 정률 쿠폰 생성', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(adminUser);
            mockPrisma.coupon.create.mockResolvedValue(percentageCoupon);

            const dto = { name: '10%', type: CouponType.PERCENTAGE, discountValue: 10 };
            const result = await service.createCoupon('admin-1', dto as any);

            expect(result).toEqual(percentageCoupon);
            expect(mockPrisma.coupon.create).toHaveBeenCalledOnce();
        });

        it('정률 쿠폰 discountValue > 100 → BadRequestException', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(adminUser);

            await expect(
                service.createCoupon('admin-1', { type: CouponType.PERCENTAGE, discountValue: 101 } as any),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('이미 쓰는 프로모 코드 → BadRequestException (DB 유니크 오류 대신)', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(adminUser);
            mockPrisma.coupon.findUnique.mockResolvedValue({ id: 'coupon-existing' });

            await expect(service.createCoupon('admin-1', {
                name: '중복 코드', code: 'WELCOME', type: CouponType.FIXED_AMOUNT, discountValue: 3000,
            } as any)).rejects.toBeInstanceOf(BadRequestException);
            expect(mockPrisma.coupon.create).not.toHaveBeenCalled();
        });

        it('관리자 아닌 사용자 → ForbiddenException', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(regularUser);

            await expect(
                service.createCoupon('user-1', { type: CouponType.FIXED_AMOUNT, discountValue: 3000 } as any),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });
    });

    // ─── User: redeemCode ─────────────────────────────────────────────

    describe('redeemCode', () => {
        it('유효한 코드로 쿠폰 등록', async () => {
            mockPrisma.coupon.findUnique.mockResolvedValue(fixedCoupon);
            mockPrisma.userCoupon.findUnique.mockResolvedValue(null);
            const issued = { id: 'uc-1', coupon: fixedCoupon };
            mockPrisma.userCoupon.create.mockResolvedValue(issued);

            const result = await service.redeemCode('user-1', { code: 'FIXED3000' });
            expect(result).toEqual(issued);
        });

        it('비활성 쿠폰 → NotFoundException', async () => {
            mockPrisma.coupon.findUnique.mockResolvedValue({ ...fixedCoupon, isActive: false });

            await expect(service.redeemCode('user-1', { code: 'FIXED3000' })).rejects.toBeInstanceOf(NotFoundException);
        });

        it('발급 한도 초과 → BadRequestException', async () => {
            // 아직 아무도 사용하지 않았어도(usedCount 0) 이미 한도만큼 발급됐으면 막아야 한다.
            mockPrisma.coupon.findUnique.mockResolvedValue({ ...fixedCoupon, maxUses: 3, usedCount: 0 });
            mockPrisma.userCoupon.findUnique.mockResolvedValue(null);
            mockPrisma.userCoupon.count.mockResolvedValue(3);

            await expect(service.redeemCode('user-1', { code: 'FIXED3000' })).rejects.toBeInstanceOf(BadRequestException);
        });

        it('중복 보유 → BadRequestException', async () => {
            mockPrisma.coupon.findUnique.mockResolvedValue(fixedCoupon);
            mockPrisma.userCoupon.findUnique.mockResolvedValue({ id: 'uc-existing' });

            await expect(service.redeemCode('user-1', { code: 'FIXED3000' })).rejects.toBeInstanceOf(BadRequestException);
        });
    });

    // ─── Admin: setCouponActive ────────────────────────────────────────

    describe('setCouponActive', () => {
        it('관리자가 쿠폰을 비활성으로 전환', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(adminUser);
            mockPrisma.coupon.findUnique.mockResolvedValue(fixedCoupon);
            mockPrisma.coupon.update.mockResolvedValue({ ...fixedCoupon, isActive: false });

            await expect(service.setCouponActive('admin-1', 'coupon-2', false))
                .resolves.toMatchObject({ isActive: false });
            expect(mockPrisma.coupon.update).toHaveBeenCalledWith({
                where: { id: 'coupon-2' },
                data: { isActive: false },
            });
        });

        it('없는 쿠폰 → NotFoundException', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(adminUser);
            mockPrisma.coupon.findUnique.mockResolvedValue(null);

            await expect(service.setCouponActive('admin-1', 'nope', false)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('관리자 아닌 사용자 → ForbiddenException', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(regularUser);

            await expect(service.setCouponActive('user-1', 'coupon-2', false)).rejects.toBeInstanceOf(ForbiddenException);
            expect(mockPrisma.coupon.update).not.toHaveBeenCalled();
        });
    });

    // ─── Admin: issueCouponToUser ──────────────────────────────────────

    describe('issueCouponToUser', () => {
        const issueArgs = ['admin-1', 'coupon-2', { userId: 'user-1' }] as const;

        beforeEach(() => {
            mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
                Promise.resolve(where.id === adminUser.id ? adminUser : regularUser),
            );
            mockPrisma.coupon.findUnique.mockResolvedValue(fixedCoupon);
            mockPrisma.userCoupon.findUnique.mockResolvedValue(null);
        });

        it('관리자가 사용자에게 발급', async () => {
            const issued = { id: 'uc-1', coupon: fixedCoupon };
            mockPrisma.userCoupon.create.mockResolvedValue(issued);

            await expect(service.issueCouponToUser(...issueArgs)).resolves.toEqual(issued);
        });

        it('발급 한도에 도달했으면 → BadRequestException', async () => {
            mockPrisma.coupon.findUnique.mockResolvedValue({ ...fixedCoupon, maxUses: 2, usedCount: 0 });
            mockPrisma.userCoupon.count.mockResolvedValue(2);

            await expect(service.issueCouponToUser(...issueArgs)).rejects.toBeInstanceOf(BadRequestException);
            expect(mockPrisma.userCoupon.create).not.toHaveBeenCalled();
        });

        it('이미 보유한 사용자에게 재발급 → BadRequestException (DB 유니크 오류 대신)', async () => {
            mockPrisma.userCoupon.findUnique.mockResolvedValue({ id: 'uc-existing' });

            await expect(service.issueCouponToUser(...issueArgs)).rejects.toBeInstanceOf(BadRequestException);
            expect(mockPrisma.userCoupon.create).not.toHaveBeenCalled();
        });
    });

    // ─── validateAndCalculateDiscount ────────────────────────────────

    describe('validateAndCalculateDiscount', () => {
        const futureDate = new Date(Date.now() + 86400000);

        it('정률 10% 할인, 상한 5000원 미만 → 정확한 할인액', async () => {
            mockPrisma.userCoupon.findUnique.mockResolvedValue({
                id: 'uc-1', userId: 'user-1', isUsed: false,
                expiresAt: futureDate, coupon: percentageCoupon,
            });

            const { discountAmount } = await service.validateAndCalculateDiscount('user-1', 'uc-1', 20000);
            expect(discountAmount).toBe(2000); // 20000 * 10% = 2000
        });

        it('정률 할인이 상한액(5000원)을 초과하면 cap 적용', async () => {
            mockPrisma.userCoupon.findUnique.mockResolvedValue({
                id: 'uc-1', userId: 'user-1', isUsed: false,
                expiresAt: futureDate, coupon: percentageCoupon,
            });

            const { discountAmount } = await service.validateAndCalculateDiscount('user-1', 'uc-1', 100000);
            expect(discountAmount).toBe(5000); // 100000 * 10% = 10000 → capped at 5000
        });

        it('정액 쿠폰 할인, 주문금액 초과 방지', async () => {
            const smallCoupon = { ...fixedCoupon, discountValue: 5000, minOrderAmount: null };
            mockPrisma.userCoupon.findUnique.mockResolvedValue({
                id: 'uc-2', userId: 'user-1', isUsed: false,
                expiresAt: futureDate, coupon: smallCoupon,
            });

            const { discountAmount } = await service.validateAndCalculateDiscount('user-1', 'uc-2', 3000);
            expect(discountAmount).toBe(3000); // min(5000, 3000) = 3000
        });

        it('최소 주문금액 미달 → BadRequestException', async () => {
            mockPrisma.userCoupon.findUnique.mockResolvedValue({
                id: 'uc-2', userId: 'user-1', isUsed: false,
                expiresAt: futureDate, coupon: fixedCoupon, // minOrderAmount: 10000
            });

            await expect(
                service.validateAndCalculateDiscount('user-1', 'uc-2', 5000),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('만료된 쿠폰 → BadRequestException', async () => {
            mockPrisma.userCoupon.findUnique.mockResolvedValue({
                id: 'uc-1', userId: 'user-1', isUsed: false,
                expiresAt: new Date(Date.now() - 1000), coupon: percentageCoupon,
            });

            await expect(
                service.validateAndCalculateDiscount('user-1', 'uc-1', 20000),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('이미 사용된 쿠폰 → BadRequestException', async () => {
            mockPrisma.userCoupon.findUnique.mockResolvedValue({
                id: 'uc-1', userId: 'user-1', isUsed: true,
                expiresAt: futureDate, coupon: percentageCoupon,
            });

            await expect(
                service.validateAndCalculateDiscount('user-1', 'uc-1', 20000),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('다른 사용자 쿠폰 → NotFoundException', async () => {
            mockPrisma.userCoupon.findUnique.mockResolvedValue({
                id: 'uc-1', userId: 'other-user', isUsed: false,
                expiresAt: futureDate, coupon: percentageCoupon,
            });

            await expect(
                service.validateAndCalculateDiscount('user-1', 'uc-1', 20000),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    // ─── getMyAvailableCoupons ────────────────────────────────────────

    describe('getMyAvailableCoupons', () => {
        it('사용 가능한 쿠폰만 반환', async () => {
            const coupons = [{ id: 'uc-1', coupon: percentageCoupon }];
            mockPrisma.userCoupon.findMany.mockResolvedValue(coupons);

            const result = await service.getMyAvailableCoupons('user-1');
            expect(result).toEqual(coupons);
            expect(mockPrisma.userCoupon.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ isUsed: false }),
                }),
            );
        });
    });
});
