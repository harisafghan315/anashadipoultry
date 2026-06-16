-- Migration 011: link a supplier payment to the client/farm it's on behalf of.
-- A Saraf paying a meel for Bill #X is doing so because client/farm Y sent the
-- Saraf money. Recording farm_id closes the loop so each OUT can be matched
-- back to the IN that funded it. Nullable so direct payments (Anas Hadi's
-- own cash to a supplier) still work. Idempotent.

alter table supplier_payments
  add column if not exists farm_id uuid references farms(id) on delete set null;

create index if not exists idx_supplier_payments_farm_id on supplier_payments(farm_id);
