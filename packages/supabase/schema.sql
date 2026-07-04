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
  created_at timestamptz default now()
);

alter table public.categories enable row level security;
create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id);

-- Default categories seeded on first login (call from app)
-- ============================================================
-- VAULT — TRANSACTIONS
-- ============================================================
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories on delete set null,
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
