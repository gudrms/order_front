CREATE TABLE IF NOT EXISTS "BrandBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "badge" TEXT,
    "bgType" TEXT NOT NULL,
    "bgStartColor" TEXT,
    "bgEndColor" TEXT,
    "imageUrl" TEXT,
    "linkType" TEXT NOT NULL,
    "linkUrl" TEXT,
    "storeId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandBanner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BrandBanner_isActive_displayOrder_idx" ON "BrandBanner"("isActive", "displayOrder");
