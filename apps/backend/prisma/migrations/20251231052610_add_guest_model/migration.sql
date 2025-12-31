/*
  Warnings:

  - Made the column `guestCount` on table `TableSession` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TableSession" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "guestCount" SET NOT NULL;

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "name" TEXT,
    "email" TEXT,
    "birthday" TIMESTAMP(3),
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "lastVisitedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_phoneNumber_key" ON "Guest"("phoneNumber");

-- CreateIndex
CREATE INDEX "Guest_phoneNumber_idx" ON "Guest"("phoneNumber");

-- CreateIndex
CREATE INDEX "Guest_visitCount_idx" ON "Guest"("visitCount");

-- CreateIndex
CREATE INDEX "Guest_totalSpent_idx" ON "Guest"("totalSpent");

-- CreateIndex
CREATE INDEX "TableSession_guestId_idx" ON "TableSession"("guestId");

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
