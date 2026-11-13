-- =========================================================================
-- MIGRATION 004: CXRNER MUSIC UNIFIED DIGITAL ECOSYSTEM
-- CXRNER ID + DROP GAME + ARTIST NETWORK + REFERRAL SYSTEM + ADMIN SUITE
-- =========================================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- 1. CXRNER USER PROFILES (CXRNER ID)
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  banner_url text,
  bio text,
  country text default 'RU',
  city text,
  genres text[] default '{}',
  music_roles text[] default '{}',
  social_links jsonb not null default '[]'::jsonb,
  music_links jsonb not null default '[]'::jsonb,
  telegram_id text,
  telegram_username text,
  telegram_linked boolean not null default false,
  is_artist_verified boolean not null default false,
  completion_percentage integer not null default 0,
  completion_reward_80_claimed boolean not null default false,
  completion_reward_100_claimed boolean not null default false,
  privacy_settings jsonb not null default '{
    "is_public": true,
    "show_inventory": true,
    "show_stats": true,
    "show_referrals": true,
    "show_music": true,
    "show_in_leaderboard": true
  }'::jsonb,
  equipped_frame text default null,
  equipped_effect text default null,
  equipped_title text default null,
  equipped_badge text default null,
  equipped_showcase_item text default null,
  equipped_background text default null,
  pinned_achievements text[] not null default '{}',
  pinned_items text[] not null default '{}',
  is_banned boolean not null default false,
  ban_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cxrner_profiles_username_idx on public.cxrner_profiles (lower(username));
create index if not exists cxrner_profiles_telegram_id_idx on public.cxrner_profiles (telegram_id) where telegram_id is not null;
create index if not exists cxrner_profiles_verified_idx on public.cxrner_profiles (is_artist_verified);

-- -------------------------------------------------------------------------
-- 2. CXRNER ARTIST PROFILES & PROJECTS
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_name text not null,
  project_type text not null default 'solo', -- 'solo', 'duo', 'band', 'collective'
  avatar_url text,
  banner_url text,
  bio text,
  genres text[] default '{}',
  country text default 'RU',
  city text,
  spotify_url text,
  apple_music_url text,
  yandex_music_url text,
  vk_music_url text,
  soundcloud_url text,
  youtube_url text,
  bandcamp_url text,
  instagram_url text,
  tiktok_url text,
  telegram_url text,
  website_url text,
  members jsonb not null default '[]'::jsonb, -- [{ name, role, email, user_id }]
  verification_status text not null default 'not_verified', -- 'not_verified', 'draft', 'pending', 'needs_info', 'verified', 'rejected', 'suspended'
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cxrner_artist_profiles_user_id_idx on public.cxrner_artist_profiles (user_id);
create index if not exists cxrner_artist_profiles_status_idx on public.cxrner_artist_profiles (verification_status);

-- -------------------------------------------------------------------------
-- 3. ARTIST VERIFICATIONS WORKFLOW
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_artist_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_profile_id uuid references public.cxrner_artist_profiles(id) on delete cascade,
  stage_name text not null,
  method text not null default 'manual', -- 'oauth', 'code', 'manual'
  verification_code text, -- e.g. 'CXRNER-7821'
  verification_code_status text default 'active', -- 'active', 'verified', 'expired'
  evidence_links jsonb not null default '[]'::jsonb,
  evidence_notes text,
  status text not null default 'pending', -- 'pending', 'needs_info', 'verified', 'rejected', 'suspended'
  reviewer_notes text,
  reject_reason text,
  reward_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists cxrner_artist_verifications_user_idx on public.cxrner_artist_verifications (user_id);
create index if not exists cxrner_artist_verifications_status_idx on public.cxrner_artist_verifications (status);

-- -------------------------------------------------------------------------
-- 4. CXRNER DROP INVENTORY & SPECIMENS
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_drop_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_name text not null,
  collection_name text not null,
  rarity text not null default 'common', -- 'common', 'rare', 'epic', 'legendary', 'mythic'
  serial_number integer not null default 1,
  description text,
  image_url text,
  model_3d_type text not null default 'procedural',
  model_color text not null default '#8737FF',
  obtained_via text not null default 'starter_drop',
  is_equipped boolean not null default false,
  is_pinned boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cxrner_drop_inventory_user_idx on public.cxrner_drop_inventory (user_id);
create index if not exists cxrner_drop_inventory_rarity_idx on public.cxrner_drop_inventory (rarity);

-- -------------------------------------------------------------------------
-- 5. CXP WALLET & TRANSACTIONS LEDGER
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_cxp_wallet (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.cxrner_cxp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  operation_type text not null, -- 'credit', 'debit'
  reason text not null,
  source_event_type text not null, -- 'profile_80', 'profile_100', 'artist_verified', 'referral_signup', 'referral_profile', 'referral_release', 'drop_opening', 'admin_adjustment'
  source_event_id text,
  admin_notes text,
  created_at timestamptz not null default now(),
  constraint cxp_unique_event unique (user_id, source_event_type, source_event_id)
);

create index if not exists cxp_transactions_user_idx on public.cxrner_cxp_transactions (user_id);
create index if not exists cxp_transactions_created_idx on public.cxrner_cxp_transactions (created_at desc);

-- -------------------------------------------------------------------------
-- 6. ACHIEVEMENTS
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  is_pinned boolean not null default false,
  constraint user_achievement_unique unique (user_id, achievement_key)
);

create index if not exists cxrner_achievements_user_idx on public.cxrner_achievements (user_id);

-- -------------------------------------------------------------------------
-- 7. REFERRAL NETWORK & ATTRIBUTIONS
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade unique,
  referral_code text not null,
  status text not null default 'registered', -- 'registered', 'email_verified', 'profile_completed', 'release_approved', 'artist_verified', 'qualified', 'flagged_fraud'
  ip_hash text,
  is_qualified boolean not null default false,
  qualified_at timestamptz,
  fraud_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_referral check (referrer_user_id <> referred_user_id)
);

create index if not exists cxrner_referrals_referrer_idx on public.cxrner_referrals (referrer_user_id);
create index if not exists cxrner_referrals_code_idx on public.cxrner_referrals (referral_code);

create table if not exists public.cxrner_referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.cxrner_referrals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'referrer', -- 'referrer', 'referee'
  event_type text not null, -- 'email_verified', 'profile_80_tg', 'first_release', 'artist_verified'
  cxp_amount integer not null,
  status text not null default 'granted', -- 'granted', 'pending_review', 'revoked'
  created_at timestamptz not null default now(),
  constraint referral_reward_event_unique unique (referral_id, user_id, event_type)
);

create index if not exists cxrner_referral_rewards_user_idx on public.cxrner_referral_rewards (user_id);

-- -------------------------------------------------------------------------
-- 8. NOTIFICATIONS & AUDIT LOGS
-- -------------------------------------------------------------------------
create table if not exists public.cxrner_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'drop_item', 'cxp_earned', 'achievement', 'verification_update', 'referral_reward', 'system'
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cxrner_notifications_user_idx on public.cxrner_notifications (user_id, is_read, created_at desc);

create table if not exists public.cxrner_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_user_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cxrner_admin_audit_created_idx on public.cxrner_admin_audit_log (created_at desc);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
alter table public.cxrner_profiles enable row level security;
alter table public.cxrner_artist_profiles enable row level security;
alter table public.cxrner_artist_verifications enable row level security;
alter table public.cxrner_drop_inventory enable row level security;
alter table public.cxrner_cxp_wallet enable row level security;
alter table public.cxrner_cxp_transactions enable row level security;
alter table public.cxrner_achievements enable row level security;
alter table public.cxrner_referrals enable row level security;
alter table public.cxrner_referral_rewards enable row level security;
alter table public.cxrner_notifications enable row level security;
alter table public.cxrner_admin_audit_log enable row level security;

-- Public Profiles: readable by all if is_public = true, full edit by owner
create policy "public_profiles_view" on public.cxrner_profiles
  for select to anon, authenticated
  using ((privacy_settings ->> 'is_public')::boolean is distinct from false or auth.uid() = id);

create policy "users_manage_own_profile" on public.cxrner_profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Artist Profiles
create policy "artist_profiles_view" on public.cxrner_artist_profiles
  for select to anon, authenticated using (true);

create policy "users_manage_own_artist_profile" on public.cxrner_artist_profiles
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inventory: public can see items pinned or showcased unless hidden
create policy "drop_inventory_view" on public.cxrner_drop_inventory
  for select to anon, authenticated
  using (auth.uid() = user_id or (is_pinned = true and is_hidden = false));

create policy "users_manage_own_inventory" on public.cxrner_drop_inventory
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Wallet & Transactions: strictly owner or admin
create policy "users_view_own_wallet" on public.cxrner_cxp_wallet
  for select to authenticated
  using (auth.uid() = user_id);

create policy "users_view_own_transactions" on public.cxrner_cxp_transactions
  for select to authenticated
  using (auth.uid() = user_id);

-- Notifications: strictly owner
create policy "users_manage_own_notifications" on public.cxrner_notifications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for avatars and banners
insert into storage.buckets (id, name, public)
values ('cxrner-profiles', 'cxrner-profiles', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_profile_media" on storage.objects;
create policy "public_read_profile_media" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'cxrner-profiles');

drop policy if exists "authenticated_upload_profile_media" on storage.objects;
create policy "authenticated_upload_profile_media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cxrner-profiles');
