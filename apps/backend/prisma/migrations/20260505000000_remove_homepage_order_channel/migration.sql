-- AlterEnum: OrderChannel에서 HOMEPAGE 값 제거
-- 정책 전환(2026-05-02): 홈페이지 직접 주문 폐기 → 배달앱 리다이렉트로 단일화
-- 적용 전: HOMEPAGE source를 가진 주문 건수를 확인하고, 없으면 적용하세요.
-- SELECT COUNT(*) FROM "Order" WHERE source = 'HOMEPAGE';

BEGIN;

CREATE TYPE "OrderChannel_new" AS ENUM ('TABLE_ORDER', 'DELIVERY_APP', 'ADMIN', 'TOSS_SDK', 'POS');

ALTER TABLE "Order"
  ALTER COLUMN "source" TYPE "OrderChannel_new"
  USING ("source"::text::"OrderChannel_new");

ALTER TYPE "OrderChannel" RENAME TO "OrderChannel_old";
ALTER TYPE "OrderChannel_new" RENAME TO "OrderChannel";
DROP TYPE "OrderChannel_old";

COMMIT;
