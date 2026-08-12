-- =============================================================
-- Snowball Portfolio Tracker — Supabase schema
-- Paste the whole file into: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================

-- 1) Profiles (one row per user, created automatically on signup)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default '',
  avatar_color text not null default '#0ea5e9',
  currency text not null default 'USD',
  theme text not null default 'dark',
  accent text not null default 'sky',
  refresh_seconds integer not null default 60,
  default_yield_pct numeric not null default 2,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- 2) Broker accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  broker text not null default 'generic',
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "accounts_own" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Holdings (belong to an account, which belongs to a user)
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  symbol text not null,
  name text,
  shares numeric not null,
  cost_basis numeric not null default 0,
  currency text not null default 'USD',
  added_at timestamptz not null default now()
);

alter table public.holdings enable row level security;

create policy "holdings_own" on public.holdings
  for all
  using (exists (
    select 1 from public.accounts a
    where a.id = holdings.account_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.accounts a
    where a.id = holdings.account_id and a.user_id = auth.uid()
  ));

-- 4) Dividend events
create table if not exists public.dividends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  amount_per_share numeric not null,
  ex_date date,
  pay_date date,
  currency text not null default 'USD',
  status text not null default 'upcoming',
  created_at timestamptz not null default now()
);

alter table public.dividends enable row level security;

create policy "dividends_own" on public.dividends
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) Watchlist
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  added_at timestamptz not null default now(),
  unique (user_id, symbol)
);

alter table public.watchlist enable row level security;

create policy "watchlist_own" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6) Portfolio snapshots (history chart)
create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null default now(),
  total_value numeric not null
);

alter table public.snapshots enable row level security;

create policy "snapshots_own" on public.snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7) Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for common reads
create index if not exists holdings_account_id_idx on public.holdings (account_id);
create index if not exists accounts_user_id_idx on public.accounts (user_id);
create index if not exists dividends_user_id_idx on public.dividends (user_id);
create index if not exists snapshots_user_id_idx on public.snapshots (user_id);

-- 8) Community chat (public, anonymous, realtime)
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  category text not null check (category in ('general','bullish','bearish','dividends','qa')),
  author_name text not null default 'Anonymous',
  author_color text not null default '#38bdf8',
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

-- Allow public (incl. anonymous visitors) to read & write chat.
-- Spam is limited client-side (10s between messages) and via the 500-char cap.
alter table public.chat_messages enable row level security;

create policy "chat_read_public" on public.chat_messages
  for select using (true);

create policy "chat_insert_public" on public.chat_messages
  for insert with check (true);

create index if not exists chat_messages_category_time_idx
  on public.chat_messages (category, created_at desc);

-- Realtime: allow frontend to subscribe to new rows
alter publication supabase_realtime add table public.chat_messages;