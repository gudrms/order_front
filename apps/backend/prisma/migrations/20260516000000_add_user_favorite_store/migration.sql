-- CreateTable
CREATE TABLE "UserFavoriteStore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavoriteStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFavoriteStore_userId_storeId_key" ON "UserFavoriteStore"("userId", "storeId");
CREATE INDEX "UserFavoriteStore_userId_idx" ON "UserFavoriteStore"("userId");

-- AddForeignKey
ALTER TABLE "UserFavoriteStore" ADD CONSTRAINT "UserFavoriteStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFavoriteStore" ADD CONSTRAINT "UserFavoriteStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
