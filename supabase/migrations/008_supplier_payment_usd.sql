-- Migration 008: supplier payments can be made in USD (medicine suppliers).
-- The code always writes amount_usd (0 for AFN payments), so the column is
-- required even for AFN-only stores. Idempotent.
alter table supplier_payments add column if not exists amount_usd numeric default 0;
