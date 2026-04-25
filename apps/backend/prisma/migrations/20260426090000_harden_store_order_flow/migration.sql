-- Order numbers are displayed per store, so uniqueness must also be scoped per store.
DROP INDEX IF EXISTS "Order_orderNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Order_storeId_orderNumber_key" ON "Order"("storeId", "orderNumber");
