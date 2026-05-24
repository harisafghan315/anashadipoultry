-- Migration 002: schema drift — tables/columns the app uses that were added
-- after the original schema export. Idempotent; run in the Supabase SQL Editor.

-- Chicken batches (seasons) per farm/client
create table if not exists farm_batches (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  batch_number integer not null default 1,
  start_date date,
  end_date date,
  initial_chicken_count integer default 0,
  price_per_chicken numeric default 0,
  supplier_id uuid references suppliers(id) on delete set null,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Cash payments received from market sellers (independent of farm finances)
create table if not exists market_seller_payments (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references market_sellers(id) on delete cascade,
  amount numeric not null default 0,
  payment_date date not null default current_date,
  notes text,
  created_at timestamp with time zone default now()
);

-- Per-batch tagging on existing tables
alter table chicken_deaths add column if not exists batch_id uuid references farm_batches(id) on delete set null;
alter table market_transactions add column if not exists batch_id uuid references farm_batches(id) on delete set null;

-- RLS policies for the new tables (Supabase keeps RLS on for API tables)
alter table farm_batches enable row level security;
drop policy if exists "Allow all" on farm_batches;
create policy "Allow all" on farm_batches for all using (true) with check (true);

alter table market_seller_payments enable row level security;
drop policy if exists "Allow all" on market_seller_payments;
create policy "Allow all" on market_seller_payments for all using (true) with check (true);
