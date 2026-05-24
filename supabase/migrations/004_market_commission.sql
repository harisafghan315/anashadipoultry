-- Migration 004: Market commission & per-transaction expenses.
-- For each market transaction we now track Anas Hadi's commission earned
-- (commission_per_chicken × chicken_count) and any expenses tied to that
-- specific transaction. Profit = commission - expenses.

alter table market_transactions add column if not exists commission_per_chicken numeric default 0;

create table if not exists market_transaction_expenses (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references market_transactions(id) on delete cascade,
  description text not null,
  amount numeric not null default 0,
  expense_date date not null default current_date,
  created_at timestamp with time zone default now()
);

create index if not exists market_transaction_expenses_tx_idx on market_transaction_expenses (transaction_id);

alter table market_transaction_expenses enable row level security;
drop policy if exists "Allow all" on market_transaction_expenses;
create policy "Allow all" on market_transaction_expenses for all using (true) with check (true);
