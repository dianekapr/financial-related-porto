-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VAULT — CATEGORIES
-- ============================================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null default '💰',
  color text not null default '#C9A84C',
  budget_limit numeric(12,2),
  created_at timestamptz default now(),
  unique (user_id, name)
);

alter table public.categories enable row level security;
create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id);

-- Default categories seeded via trigger on signup (not client-side — a
-- client-side "insert if empty" check races under React StrictMode's
-- double-invoked effects and silently double-seeds every category)
create or replace function public.seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, icon, color) values
    (new.id, 'Makan & Minum', '🍜', '#E03E3E'),
    (new.id, 'Transport', '🚗', '#C9A84C'),
    (new.id, 'Belanja', '🛍️', '#8B5CF6'),
    (new.id, 'Hiburan', '🎬', '#06B6D4'),
    (new.id, 'Kesehatan', '💊', '#22C55E'),
    (new.id, 'Tagihan', '📄', '#F97316'),
    (new.id, 'Gaji', '💰', '#C9A84C'),
    (new.id, 'Freelance', '💻', '#22C55E'),
    (new.id, 'Lainnya', '📌', '#888888')
  on conflict (user_id, name) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute procedure public.seed_default_categories();

-- ============================================================
-- VAULT — WALLETS (cash, e-wallet, bank accounts, etc.)
-- ============================================================
create table public.wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  balance numeric(12,2) not null default 0,
  color text not null default '#C9A84C',
  created_at timestamptz default now()
);

alter table public.wallets enable row level security;
create policy "Users manage own wallets" on public.wallets
  for all using (auth.uid() = user_id);

-- ============================================================
-- VAULT — TRANSACTIONS
-- ============================================================
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories on delete set null,
  wallet_id uuid references public.wallets on delete set null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);

create index transactions_user_date on public.transactions(user_id, date desc);

-- ============================================================
-- VAULT — BUDGETS
-- ============================================================
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references public.categories on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  month int not null check (month between 1 and 12),
  year int not null,
  unique (user_id, category_id, month, year)
);

alter table public.budgets enable row level security;
create policy "Users manage own budgets" on public.budgets
  for all using (auth.uid() = user_id);

-- ============================================================
-- SLICE — BILLS
-- ============================================================
create table public.bills (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  title text not null,
  total numeric(12,2) not null default 0,
  currency text not null default 'IDR',
  date date not null default current_date,
  receipt_url text,
  is_settled boolean default false,
  created_at timestamptz default now()
);

alter table public.bills enable row level security;
create policy "Bill owner full access" on public.bills
  for all using (auth.uid() = owner_id);

-- ============================================================
-- SLICE — BILL MEMBERS
-- ============================================================
create table public.bill_members (
  id uuid default uuid_generate_v4() primary key,
  bill_id uuid references public.bills on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  name text not null,
  color text not null default '#FF5E1A',
  avatar_emoji text not null default '🧑'
);

alter table public.bill_members enable row level security;
create policy "Bill members visible to bill owner" on public.bill_members
  for all using (
    exists (select 1 from public.bills where id = bill_id and owner_id = auth.uid())
  );

-- ============================================================
-- SLICE — BILL ITEMS
-- ============================================================
create table public.bill_items (
  id uuid default uuid_generate_v4() primary key,
  bill_id uuid references public.bills on delete cascade not null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  quantity int not null default 1 check (quantity > 0)
);

alter table public.bill_items enable row level security;
create policy "Bill items visible to bill owner" on public.bill_items
  for all using (
    exists (select 1 from public.bills where id = bill_id and owner_id = auth.uid())
  );

-- ============================================================
-- SLICE — BILL ITEM ASSIGNMENTS
-- ============================================================
create table public.bill_item_assignments (
  id uuid default uuid_generate_v4() primary key,
  bill_item_id uuid references public.bill_items on delete cascade not null,
  member_id uuid references public.bill_members on delete cascade not null,
  share_amount numeric(12,2) not null,
  unique (bill_item_id, member_id)
);

alter table public.bill_item_assignments enable row level security;
create policy "Assignments visible to bill owner" on public.bill_item_assignments
  for all using (
    exists (
      select 1 from public.bill_items bi
      join public.bills b on b.id = bi.bill_id
      where bi.id = bill_item_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- SLICE — PAYMENTS
-- ============================================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  bill_id uuid references public.bills on delete cascade not null,
  from_member_id uuid references public.bill_members on delete cascade not null,
  to_member_id uuid references public.bill_members on delete cascade not null,
  amount numeric(12,2) not null,
  is_settled boolean default false,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;
create policy "Payments visible to bill owner" on public.payments
  for all using (
    exists (select 1 from public.bills where id = bill_id and owner_id = auth.uid())
  );

-- ============================================================
-- Supabase Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);

create policy "Authenticated users can upload receipts" on storage.objects
  for insert with check (bucket_id = 'receipts' and auth.role() = 'authenticated');
create policy "Receipt owner can read" on storage.objects
  for select using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- MIGRATION — run manually in SQL Editor if `bills` already exists
-- (adds per-bill currency, chosen at bill creation)
-- ============================================================
-- alter table public.bills add column if not exists currency text not null default 'IDR';

-- ============================================================
-- MIGRATION — run manually in SQL Editor if `categories`/`transactions`
-- already exist (fixes the client-side seeding race that double-created
-- every default category, and adds the Wallets feature)
-- ============================================================
-- -- 1. Remap any transactions/budgets pointing at a duplicate category
-- --    row onto the earliest-created row for that (user_id, name)
-- with ranked as (
--   select id, user_id, name,
--     row_number() over (partition by user_id, name order by created_at, id) as rn
--   from public.categories
-- ),
-- keep as (
--   select user_id, name, id as keep_id from ranked where rn = 1
-- ),
-- dupes as (
--   select r.id as dup_id, k.keep_id
--   from ranked r join keep k using (user_id, name)
--   where r.rn > 1
-- )
-- update public.transactions t set category_id = d.keep_id
-- from dupes d where t.category_id = d.dup_id;
--
-- with ranked as (
--   select id, user_id, name,
--     row_number() over (partition by user_id, name order by created_at, id) as rn
--   from public.categories
-- ),
-- keep as (
--   select user_id, name, id as keep_id from ranked where rn = 1
-- ),
-- dupes as (
--   select r.id as dup_id, k.keep_id
--   from ranked r join keep k using (user_id, name)
--   where r.rn > 1
-- )
-- update public.budgets b set category_id = d.keep_id
-- from dupes d where b.category_id = d.dup_id;
--
-- -- 2. Delete the now-unreferenced duplicate category rows
-- delete from public.categories c
-- where exists (
--   select 1 from (
--     select id, row_number() over (partition by user_id, name order by created_at, id) as rn
--     from public.categories
--   ) r where r.id = c.id and r.rn > 1
-- );
--
-- -- 3. Prevent future duplicates, then swap seeding from client-side to a signup trigger
-- alter table public.categories add constraint categories_user_name_unique unique (user_id, name);
--
-- create or replace function public.seed_default_categories()
-- returns trigger as $$
-- begin
--   insert into public.categories (user_id, name, icon, color) values
--     (new.id, 'Makan & Minum', '🍜', '#E03E3E'),
--     (new.id, 'Transport', '🚗', '#C9A84C'),
--     (new.id, 'Belanja', '🛍️', '#8B5CF6'),
--     (new.id, 'Hiburan', '🎬', '#06B6D4'),
--     (new.id, 'Kesehatan', '💊', '#22C55E'),
--     (new.id, 'Tagihan', '📄', '#F97316'),
--     (new.id, 'Gaji', '💰', '#C9A84C'),
--     (new.id, 'Freelance', '💻', '#22C55E'),
--     (new.id, 'Lainnya', '📌', '#888888')
--   on conflict (user_id, name) do nothing;
--   return new;
-- end;
-- $$ language plpgsql security definer;
--
-- create trigger on_auth_user_created_seed_categories
--   after insert on auth.users
--   for each row execute procedure public.seed_default_categories();
--
-- -- 4. Wallets feature
-- create table if not exists public.wallets (
--   id uuid default uuid_generate_v4() primary key,
--   user_id uuid references auth.users on delete cascade not null,
--   name text not null,
--   balance numeric(12,2) not null default 0,
--   color text not null default '#C9A84C',
--   created_at timestamptz default now()
-- );
--
-- alter table public.wallets enable row level security;
-- create policy "Users manage own wallets" on public.wallets
--   for all using (auth.uid() = user_id);
--
-- alter table public.transactions add column if not exists wallet_id uuid references public.wallets on delete set null;
