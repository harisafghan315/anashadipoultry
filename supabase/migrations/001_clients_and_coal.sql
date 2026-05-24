-- Anas Hadi — migration 001: Clients (wholesale tier) + Coal dispatch category
-- Run this on the Anas Hadi Supabase project AFTER the base schema is loaded.
-- Idempotent: safe to re-run.

-- 1. Clients reuse the existing `farms` table via a `kind` discriminator.
--    'farm'   = chicken farm (Royani-style client)
--    'client' = wholesale customer (other supply stores / dealers Anas Hadi sells to)
alter table farms add column if not exists kind text not null default 'farm';

create index if not exists farms_kind_idx on farms (kind);

-- 2. Allow 'coal' as a product type so it can be stocked and dispatched
--    (alongside medicine / food / meel / choza).
alter table products drop constraint if exists products_type_check;
alter table products
  add constraint products_type_check
  check (type in ('medicine', 'food', 'meel', 'choza', 'coal'));
