-- CreateTable
CREATE TABLE "BrandMenuCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandMenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandMenu" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandMenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandMenuCategory_isActive_displayOrder_idx" ON "BrandMenuCategory"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "BrandMenu_categoryId_isActive_displayOrder_idx" ON "BrandMenu"("categoryId", "isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "BrandMenu_isFeatured_isActive_displayOrder_idx" ON "BrandMenu"("isFeatured", "isActive", "displayOrder");

-- AddForeignKey
ALTER TABLE "BrandMenu" ADD CONSTRAINT "BrandMenu_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BrandMenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
