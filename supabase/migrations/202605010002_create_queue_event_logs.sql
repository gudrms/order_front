create table if not exists "QueueEventLog" (
  "id" text primary key default gen_random_uuid()::text,
  "queueName" text not null default 'backend_events',
  "messageId" bigint,
  "eventId" text,
  "eventType" text not null,
  "idempotencyKey" text not null unique,
  "status" text not null default 'PENDING',
  "attemptCount" integer not null default 0,
  "payload" jsonb,
  "lastError" text,
  "processedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "QueueEventLog_queueName_idx" on "QueueEventLog" ("queueName");
create index if not exists "QueueEventLog_messageId_idx" on "QueueEventLog" ("messageId");
create index if not exists "QueueEventLog_eventType_status_idx" on "QueueEventLog" ("eventType", "status");
create index if not exists "QueueEventLog_status_updatedAt_idx" on "QueueEventLog" ("status", "updatedAt");

