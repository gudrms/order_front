-- Queue/POS operational state used by the backend worker.

CREATE EXTENSION IF NOT EXISTS pgmq;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PosSyncStatus') THEN
    CREATE TYPE "PosSyncStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationRecipientType') THEN
    CREATE TYPE "NotificationRecipientType" AS ENUM ('CUSTOMER', 'STORE', 'ADMIN');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'ORDER_PAID',
      'ORDER_CONFIRMED',
      'ORDER_CANCELLED',
      'DELIVERY_STATUS_CHANGED',
      'POS_SYNC_FAILED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationStatus') THEN
    CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
  END IF;
END $$;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "posSyncStatus" "PosSyncStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "posSyncAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "posSyncLastError" TEXT,
  ADD COLUMN IF NOT EXISTS "posSyncUpdatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "QueueEventLog" (
  "id" TEXT NOT NULL,
  "queueName" TEXT NOT NULL DEFAULT 'backend_events',
  "messageId" BIGINT,
  "eventId" TEXT,
  "eventType" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB,
  "lastError" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QueueEventLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationLog" (
  "id" TEXT NOT NULL,
  "recipientType" "NotificationRecipientType" NOT NULL,
  "recipientId" TEXT,
  "notificationType" "NotificationType" NOT NULL,
  "orderId" TEXT,
  "storeId" TEXT,
  "channel" TEXT NOT NULL DEFAULT 'IN_APP',
  "dedupeKey" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QueueEventLog_idempotencyKey_key" ON "QueueEventLog"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "QueueEventLog_queueName_idx" ON "QueueEventLog"("queueName");
CREATE INDEX IF NOT EXISTS "QueueEventLog_messageId_idx" ON "QueueEventLog"("messageId");
CREATE INDEX IF NOT EXISTS "QueueEventLog_eventType_status_idx" ON "QueueEventLog"("eventType", "status");
CREATE INDEX IF NOT EXISTS "QueueEventLog_status_updatedAt_idx" ON "QueueEventLog"("status", "updatedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationLog_dedupeKey_key" ON "NotificationLog"("dedupeKey");
CREATE INDEX IF NOT EXISTS "NotificationLog_recipientType_recipientId_idx" ON "NotificationLog"("recipientType", "recipientId");
CREATE INDEX IF NOT EXISTS "NotificationLog_notificationType_status_idx" ON "NotificationLog"("notificationType", "status");
CREATE INDEX IF NOT EXISTS "NotificationLog_orderId_idx" ON "NotificationLog"("orderId");
CREATE INDEX IF NOT EXISTS "NotificationLog_storeId_idx" ON "NotificationLog"("storeId");
CREATE INDEX IF NOT EXISTS "NotificationLog_status_updatedAt_idx" ON "NotificationLog"("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "Order_storeId_posSyncStatus_idx" ON "Order"("storeId", "posSyncStatus");

DO $$
BEGIN
  PERFORM pgmq.create('backend_events');
EXCEPTION
  WHEN duplicate_table OR unique_violation THEN
    NULL;
END $$;
