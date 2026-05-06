-- CreateTable: 창업 가맹 문의 테이블
CREATE TABLE "FranchiseInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FranchiseInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FranchiseInquiry_createdAt_idx" ON "FranchiseInquiry"("createdAt");

-- CreateIndex
CREATE INDEX "FranchiseInquiry_isRead_idx" ON "FranchiseInquiry"("isRead");
