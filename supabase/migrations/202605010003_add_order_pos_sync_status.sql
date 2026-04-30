do $$
begin
  create type "PosSyncStatus" as enum ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
exception
  when duplicate_object then
    null;
end $$;

alter table "Order"
  add column if not exists "posSyncStatus" "PosSyncStatus" not null default 'PENDING',
  add column if not exists "posSyncAttemptCount" integer not null default 0,
  add column if not exists "posSyncLastError" text,
  add column if not exists "posSyncUpdatedAt" timestamptz;

create index if not exists "Order_storeId_posSyncStatus_idx" on "Order" ("storeId", "posSyncStatus");

