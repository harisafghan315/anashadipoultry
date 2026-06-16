-- Migration 010: link Saraf payments to a specific bill (supplier_dispatch).
-- Lets each Saraf IN / OUT row say "this AFN X went toward Bill #12345 from
-- supplier Y." Nullable so direct (non-bill-tied) payments still work. Idempotent.

alter table payments
  add column if not exists supplier_dispatch_id uuid references supplier_dispatches(id) on delete set null;

alter table supplier_payments
  add column if not exists supplier_dispatch_id uuid references supplier_dispatches(id) on delete set null;

create index if not exists idx_payments_supplier_dispatch_id on payments(supplier_dispatch_id);
create index if not exists idx_supplier_payments_supplier_dispatch_id on supplier_payments(supplier_dispatch_id);
