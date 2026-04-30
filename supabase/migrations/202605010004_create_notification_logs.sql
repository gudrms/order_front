do $$
begin
  if not exists (select 1 from pg_type where typname = 'NotificationRecipientType') then
    create type "NotificationRecipientType" as enum ('CUSTOMER', 'STORE', 'ADMIN');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'NotificationType') then
    create type "NotificationType" as enum (
      'ORDER_PAID',
      'ORDER_CONFIRMED',
      'ORDER_CANCELLED',
      'DELIVERY_STATUS_CHANGED',
      'POS_SYNC_FAILED'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'NotificationStatus') then
    create type "NotificationStatus" as enum ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
  end if;
end $$;

create table if not exists "NotificationLog" (
  "id" text primary key default gen_random_uuid()::text,
  "recipientType" "NotificationRecipientType" not null,
  "recipientId" text,
  "notificationType" "NotificationType" not null,
  "orderId" text,
  "storeId" text,
  "channel" text not null default 'IN_APP',
  "dedupeKey" text not null unique,
  "status" "NotificationStatus" not null default 'PENDING',
  "payload" jsonb,
  "lastError" text,
  "sentAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create index if not exists "NotificationLog_recipientType_recipientId_idx"
  on "NotificationLog" ("recipientType", "recipientId");

create index if not exists "NotificationLog_notificationType_status_idx"
  on "NotificationLog" ("notificationType", "status");

create index if not exists "NotificationLog_orderId_idx"
  on "NotificationLog" ("orderId");

create index if not exists "NotificationLog_storeId_idx"
  on "NotificationLog" ("storeId");

create index if not exists "NotificationLog_status_updatedAt_idx"
  on "NotificationLog" ("status", "updatedAt");
