-- Rename legacy OKPOS leftovers to Toss naming before adding new delivery/payment fields.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Store' AND column_name = 'okposBranchCode'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Store' AND column_name = 'tossBranchCode'
  ) THEN
    ALTER TABLE "Store" RENAME COLUMN "okposBranchCode" TO "tossBranchCode";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MenuCategory' AND column_name = 'okposCategoryCode'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MenuCategory' AND column_name = 'tossCategoryCode'
  ) THEN
    ALTER TABLE "MenuCategory" RENAME COLUMN "okposCategoryCode" TO "tossCategoryCode";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Menu' AND column_name = 'okposMenuCode'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Menu' AND column_name = 'tossMenuCode'
  ) THEN
    ALTER TABLE "Menu" RENAME COLUMN "okposMenuCode" TO "tossMenuCode";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MenuOption' AND column_name = 'okposOptionCode'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'MenuOption' AND column_name = 'tossOptionCode'
  ) THEN
    ALTER TABLE "MenuOption" RENAME COLUMN "okposOptionCode" TO "tossOptionCode";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name = 'okposOrderId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name = 'tossOrderId'
  ) THEN
    ALTER TABLE "Order" RENAME COLUMN "okposOrderId" TO "tossOrderId";
  END IF;
END $$;

ALTER INDEX IF EXISTS "Store_okposBranchCode_key" RENAME TO "Store_tossBranchCode_key";
ALTER INDEX IF EXISTS "MenuCategory_storeId_okposCategoryCode_key" RENAME TO "MenuCategory_storeId_tossCategoryCode_key";
ALTER INDEX IF EXISTS "Menu_storeId_okposMenuCode_key" RENAME TO "Menu_storeId_tossMenuCode_key";

-- Extend order lifecycle for delivery, payment, and multi-client channels.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PREPARING';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERING';

CREATE TYPE "OrderChannel" AS ENUM ('TABLE_ORDER', 'DELIVERY_APP', 'HOMEPAGE', 'ADMIN', 'TOSS_SDK', 'POS');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'READY', 'PAID', 'FAILED', 'CANCELLED', 'PARTIAL_REFUNDED', 'REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('TOSS_PAYMENTS', 'TOSS_PLACE', 'KAKAO', 'NAVER', 'CASH', 'CARD_TERMINAL');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'TOSS', 'KAKAO', 'NAVER', 'SAMSUNG', 'PAYCO', 'CASH', 'TRANSFER');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'FAILED', 'CANCELLED');

ALTER TABLE "Store"
ADD COLUMN "isDeliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "minimumOrderAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "deliveryFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "freeDeliveryThreshold" INTEGER,
ADD COLUMN "deliveryRadiusMeters" INTEGER,
ADD COLUMN "estimatedDeliveryMinutes" INTEGER;

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

ALTER TABLE "Order"
ADD COLUMN "source" "OrderChannel" NOT NULL DEFAULT 'TABLE_ORDER',
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelReason" TEXT;

ALTER TABLE "OrderItemOption"
ADD COLUMN "menuOptionGroupId" TEXT,
ADD COLUMN "menuOptionId" TEXT;

ALTER TABLE "UserAddress"
ADD COLUMN "recipientName" TEXT,
ADD COLUMN "recipientPhone" TEXT,
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7),
ADD COLUMN "deliveryMemo" TEXT,
ADD COLUMN "entranceMemo" TEXT;

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "method" "PaymentMethod",
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" INTEGER NOT NULL,
  "approvedAmount" INTEGER,
  "cancelledAmount" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'KRW',
  "paymentKey" TEXT,
  "providerOrderId" TEXT,
  "idempotencyKey" TEXT,
  "receiptUrl" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderDelivery" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "addressId" TEXT,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "recipientName" TEXT NOT NULL,
  "recipientPhone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "detailAddress" TEXT,
  "zipCode" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "deliveryMemo" TEXT,
  "riderMemo" TEXT,
  "deliveryFee" INTEGER NOT NULL DEFAULT 0,
  "distanceMeters" INTEGER,
  "estimatedMinutes" INTEGER,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedAt" TIMESTAMP(3),
  "pickedUpAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_paymentKey_key" ON "Payment"("paymentKey");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_providerOrderId_idx" ON "Payment"("providerOrderId");

CREATE UNIQUE INDEX "OrderDelivery_orderId_key" ON "OrderDelivery"("orderId");
CREATE INDEX "OrderDelivery_addressId_idx" ON "OrderDelivery"("addressId");
CREATE INDEX "OrderDelivery_status_idx" ON "OrderDelivery"("status");
CREATE INDEX "OrderDelivery_recipientPhone_idx" ON "OrderDelivery"("recipientPhone");

CREATE INDEX "Order_storeId_type_status_idx" ON "Order"("storeId", "type", "status");
CREATE INDEX "Order_storeId_paymentStatus_idx" ON "Order"("storeId", "paymentStatus");

CREATE UNIQUE INDEX "UserAddress_one_default_per_user" ON "UserAddress"("userId") WHERE "isDefault" = true;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderDelivery" ADD CONSTRAINT "OrderDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderDelivery" ADD CONSTRAINT "OrderDelivery_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "UserAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
