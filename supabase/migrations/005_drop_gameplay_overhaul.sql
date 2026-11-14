-- =========================================================================
-- MIGRATION 005: CXRNER DROP GAMEPLAY OVERHAUL & SPECIMEN ARCHIVE
-- Multi-case support, full 25-item catalog, drop history, special reward claims
-- =========================================================================

-- 1. DROP CASES TABLE
create table if not exists public.cxrner_drop_cases (
  id text primary key,
  name text not null,
  slug text not null unique,
  subtitle text not null default 'SPECIMEN ARCHIVE',
  description text not null,
  price_cxp integer not null default 50,
  cover_url text,
  is_active boolean not null default true,
  available_rarities text[] not null default array['common', 'rare', 'epic', 'legendary', 'mythic', 'special_reward'],
  drop_rates jsonb not null default '{"common":55,"rare":25,"epic":13,"legendary":5.5,"mythic":1.4,"special_voucher":0.1}'::jsonb,
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- 2. CATALOG ITEMS TABLE
create table if not exists public.cxrner_drop_catalog_items (
  item_id text primary key,
  case_id text not null default 'case_001_archive',
  item_name text not null,
  collection_name text not null,
  rarity text not null, -- common, rare, epic, legendary, mythic, special_reward
  description text not null,
  image_url text not null,
  model_3d_type text not null default 'procedural',
  model_color text not null default '#8737FF',
  shape text not null default 'cylinder',
  is_active boolean not null default true,
  is_special_reward boolean not null default false,
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- 3. DROP HISTORY TABLE
create table if not exists public.cxrner_drop_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  case_name text not null,
  item_id text not null,
  item_name text not null,
  rarity text not null,
  serial_number integer not null,
  cxp_spent integer not null default 50,
  created_at timestamptz not null default now()
);

create index if not exists cxrner_drop_history_user_idx on public.cxrner_drop_history (user_id);
create index if not exists cxrner_drop_history_rarity_idx on public.cxrner_drop_history (rarity);
create index if not exists cxrner_drop_history_created_idx on public.cxrner_drop_history (created_at desc);

-- 4. SPECIAL REWARD CLAIMS TABLE (Cover Voucher etc)
create table if not exists public.special_reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id text not null default 'specimen_cover_voucher_25',
  reward_name text not null default 'CXRNER COVER VOUCHER',
  claim_code text not null unique,
  status text not null default 'WON', -- WON, PENDING_CLAIM, CLAIMED, REDEEMED, EXPIRED
  won_at timestamptz not null default now(),
  claimed_at timestamptz,
  redeemed_at timestamptz,
  admin_notes text,
  admin_id text,
  created_at timestamptz not null default now()
);

create index if not exists special_reward_claims_user_idx on public.special_reward_claims (user_id);
create index if not exists special_reward_claims_code_idx on public.special_reward_claims (claim_code);
create index if not exists special_reward_claims_status_idx on public.special_reward_claims (status);

-- 5. RLS POLICIES
alter table public.cxrner_drop_cases enable row level security;
alter table public.cxrner_drop_catalog_items enable row level security;
alter table public.cxrner_drop_history enable row level security;
alter table public.special_reward_claims enable row level security;

-- Public read for cases & items catalog
create policy "public_read_cases" on public.cxrner_drop_cases
  for select to anon, authenticated
  using (is_active = true);

create policy "public_read_catalog_items" on public.cxrner_drop_catalog_items
  for select to anon, authenticated
  using (is_active = true);

-- History: user sees own history; admin sees all
create policy "users_view_own_history" on public.cxrner_drop_history
  for select to authenticated
  using (
    auth.uid() = user_id or
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('cxrner.label@gmail.com', 'admin@cxrnermusic.com')
  );

create policy "users_insert_own_history" on public.cxrner_drop_history
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Special Reward Claims: user views own; admin manages all
create policy "users_view_own_claims" on public.special_reward_claims
  for select to authenticated
  using (
    auth.uid() = user_id or
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('cxrner.label@gmail.com', 'admin@cxrnermusic.com')
  );

create policy "users_insert_own_claims" on public.special_reward_claims
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "admin_manage_claims" on public.special_reward_claims
  for all to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('cxrner.label@gmail.com', 'admin@cxrnermusic.com')
  );

create policy "admin_manage_cases" on public.cxrner_drop_cases
  for all to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('cxrner.label@gmail.com', 'admin@cxrnermusic.com')
  );

create policy "admin_manage_items" on public.cxrner_drop_catalog_items
  for all to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('cxrner.label@gmail.com', 'admin@cxrnermusic.com')
  );

-- 6. SEED INITIAL CASES
insert into public.cxrner_drop_cases (id, name, slug, subtitle, description, price_cxp, cover_url, is_active, display_order)
values
  (
    'case_001_archive',
    'CASE 001 — ARCHIVE',
    'archive',
    'SPECIMEN ARCHIVE BASE',
    'Основной кейс с базовыми коллекционными предметами лейбла, цифровыми ключами и шансом получить ваучер на бесплатную обложку.',
    50,
    '/drop/cases/case_001_archive.svg',
    true,
    1
  ),
  (
    'case_002_black_specimen',
    'CASE 002 — BLACK SPECIMEN',
    'black-specimen',
    'ORGANIC FORMS & MASKS',
    'Редкая коллекция металлических и органических артефактов, биомеханических масок и темных реликвий CXRNER.',
    75,
    '/drop/cases/case_002_black_specimen.svg',
    true,
    2
  ),
  (
    'case_003_chrome_age',
    'CASE 003 — CHROME AGE',
    'chrome-age',
    'LIQUID CHROME & SPIKES',
    'Коллекция ультраглянцевых хромированных предметов: шипы, цепи, короны Бездны и сезонные реликвии.',
    100,
    '/drop/cases/case_003_chrome_age.svg',
    true,
    3
  )
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  description = excluded.description,
  price_cxp = excluded.price_cxp,
  cover_url = excluded.cover_url;
