/*
  Warnings:

  - You are about to drop the column `isSoldOut` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `MenuOptionGroup` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MenuOptionGroup` table. All the data in the column will be lost.
  - The `type` column on the `Store` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[storeId,okposMenuCode]` on the table `Menu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[okposBranchCode]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeType,branchId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `branchId` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchName` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeType` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('MEXICAN', 'PUB', 'JAPANESE', 'KOREAN', 'CHINESE', 'WESTERN', 'CAFE', 'GENERAL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COOKING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'USER');

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "MenuOption" DROP CONSTRAINT "MenuOption_optionGroupId_fkey";

-- DropForeignKey
ALTER TABLE "MenuOptionGroup" DROP CONSTRAINT "MenuOptionGroup_menuId_fkey";

-- AlterTable
ALTER TABLE "Menu" DROP COLUMN "isSoldOut",
DROP COLUMN "sortOrder",
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "okposMenuCode" TEXT,
ADD COLUMN     "soldOut" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MenuOption" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "okposOptionCode" TEXT,
ALTER COLUMN "price" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MenuOptionGroup" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "branchId" TEXT NOT NULL,
ADD COLUMN     "branchName" TEXT NOT NULL,
ADD COLUMN     "okposBranchCode" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "storeType" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "StoreType" NOT NULL DEFAULT 'GENERAL';

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "okposCategoryCode" TEXT,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuTag" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#FF6B35',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFF5F2',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuTagRelation" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuTagRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" INTEGER NOT NULL,
    "note" TEXT,
    "okposOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "menuName" TEXT NOT NULL,
    "menuPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemOption" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "optionGroupName" TEXT NOT NULL,
    "optionName" TEXT NOT NULL,
    "optionPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffCall" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tableNumber" INTEGER NOT NULL,
    "callType" TEXT,
    "status" "CallStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "MenuCategory_storeId_idx" ON "MenuCategory"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_storeId_okposCategoryCode_key" ON "MenuCategory"("storeId", "okposCategoryCode");

-- CreateIndex
CREATE INDEX "MenuTag_storeId_idx" ON "MenuTag"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuTag_storeId_name_key" ON "MenuTag"("storeId", "name");

-- CreateIndex
CREATE INDEX "MenuTagRelation_menuId_idx" ON "MenuTagRelation"("menuId");

-- CreateIndex
CREATE INDEX "MenuTagRelation_tagId_idx" ON "MenuTagRelation"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuTagRelation_menuId_tagId_key" ON "MenuTagRelation"("menuId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_storeId_status_idx" ON "Order"("storeId", "status");

-- CreateIndex
CREATE INDEX "Order_storeId_tableNumber_idx" ON "Order"("storeId", "tableNumber");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItemOption_orderItemId_idx" ON "OrderItemOption"("orderItemId");

-- CreateIndex
CREATE INDEX "Table_storeId_idx" ON "Table"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_storeId_tableNumber_key" ON "Table"("storeId", "tableNumber");

-- CreateIndex
CREATE INDEX "StaffCall_storeId_status_idx" ON "StaffCall"("storeId", "status");

-- CreateIndex
CREATE INDEX "StaffCall_storeId_tableNumber_idx" ON "StaffCall"("storeId", "tableNumber");

-- CreateIndex
CREATE INDEX "Menu_storeId_categoryId_idx" ON "Menu"("storeId", "categoryId");

-- CreateIndex
CREATE INDEX "Menu_storeId_isHidden_isActive_idx" ON "Menu"("storeId", "isHidden", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_storeId_okposMenuCode_key" ON "Menu"("storeId", "okposMenuCode");

-- CreateIndex
CREATE UNIQUE INDEX "Store_okposBranchCode_key" ON "Store"("okposBranchCode");

-- CreateIndex
CREATE INDEX "Store_storeType_idx" ON "Store"("storeType");

-- CreateIndex
CREATE INDEX "Store_branchId_idx" ON "Store"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeType_branchId_key" ON "Store"("storeType", "branchId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOptionGroup" ADD CONSTRAINT "MenuOptionGroup_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOption" ADD CONSTRAINT "MenuOption_optionGroupId_fkey" FOREIGN KEY ("optionGroupId") REFERENCES "MenuOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuTag" ADD CONSTRAINT "MenuTag_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuTagRelation" ADD CONSTRAINT "MenuTagRelation_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuTagRelation" ADD CONSTRAINT "MenuTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MenuTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemOption" ADD CONSTRAINT "OrderItemOption_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCall" ADD CONSTRAINT "StaffCall_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
