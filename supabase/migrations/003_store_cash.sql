-- Migration 003: Store cash drawer ("cash on hand").
-- Every money movement that touches the shop's physical cash is recorded here.
-- Balance = sum(amount where direction='in') - sum(amount where direction='out').
-- Idempotent; run in the Supabase SQL Editor.

create table if not exists cash_movements (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('in', 'out')),
  amount numeric not null default 0,
  source text,                 -- 'opening','manual','payment','advance','sale','expense','supplier_payment','supply_payment','market_payment','commission_payment','dealer_payout', etc.
  reference_id uuid,           -- optional link to the originating row (payment/expense/...)
  note text,
  movement_date date not null default current_date,
  created_at timestamp with time zone default now()
);

create index if not exists cash_movements_reference_idx on cash_movements (reference_id);

alter table cash_movements enable row level security;
drop policy if exists "Allow all" on cash_movements;
create policy "Allow all" on cash_movements for all using (true) with check (true);
