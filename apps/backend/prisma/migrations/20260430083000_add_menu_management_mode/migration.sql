CREATE TYPE "MenuManagementMode" AS ENUM ('TOSS_POS', 'ADMIN_DIRECT');

ALTER TABLE "Store"
ADD COLUMN "menuManagementMode" "MenuManagementMode" NOT NULL DEFAULT 'TOSS_POS';
