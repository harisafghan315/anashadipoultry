-- Migration 006: meel/feed supplier dispatches track a sell-price-per-bag
-- (used to compute profit on dispatched feed). Idempotent.
alter table supplier_dispatches add column if not exists sell_price_per_bag numeric default 0;
