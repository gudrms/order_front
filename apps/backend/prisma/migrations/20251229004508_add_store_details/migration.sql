-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessHours" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "theme" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'general';
