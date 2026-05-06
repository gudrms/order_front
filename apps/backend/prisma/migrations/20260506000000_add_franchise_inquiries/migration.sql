-- CreateEnum
CREATE TYPE "FranchiseInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "FranchiseInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "message" TEXT,
    "status" "FranchiseInquiryStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FranchiseInquiry_status_createdAt_idx" ON "FranchiseInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FranchiseInquiry_createdAt_idx" ON "FranchiseInquiry"("createdAt");

-- CreateIndex
CREATE INDEX "FranchiseInquiry_phone_idx" ON "FranchiseInquiry"("phone");

-- CreateIndex
CREATE INDEX "FranchiseInquiry_email_idx" ON "FranchiseInquiry"("email");
