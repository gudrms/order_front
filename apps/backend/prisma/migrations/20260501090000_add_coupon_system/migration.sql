-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable: Coupon
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxDiscountAmount" INTEGER DEFAULT 5000,
    "minOrderAmount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "defaultExpiryDays" INTEGER NOT NULL DEFAULT 30,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserCoupon
CREATE TABLE "UserCoupon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Order — add coupon fields
ALTER TABLE "Order"
    ADD COLUMN "userCouponId" TEXT,
    ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0;

-- Unique constraint on Order.userCouponId (one coupon per order)
ALTER TABLE "Order" ADD CONSTRAINT "Order_userCouponId_key" UNIQUE ("userCouponId");

-- Unique constraint on Coupon.code
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- Unique constraint on UserCoupon (한 쿠폰 중복 발급 방지)
CREATE UNIQUE INDEX "UserCoupon_userId_couponId_key" ON "UserCoupon"("userId", "couponId");

-- Indexes
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");
CREATE INDEX "UserCoupon_userId_isUsed_idx" ON "UserCoupon"("userId", "isUsed");
CREATE INDEX "UserCoupon_expiresAt_idx" ON "UserCoupon"("expiresAt");

-- FK: UserCoupon → User
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: UserCoupon → Coupon
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: Order → UserCoupon
ALTER TABLE "Order" ADD CONSTRAINT "Order_userCouponId_fkey"
    FOREIGN KEY ("userCouponId") REFERENCES "UserCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
