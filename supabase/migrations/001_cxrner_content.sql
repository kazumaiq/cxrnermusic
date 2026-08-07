create extension if not exists pgcrypto;

create table if not exists public.featured_release (
  id text primary key,
  title text not null,
  artist text not null,
  cover text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.releases_config (
  id text primary key,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.artists_config (
  id text primary key,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cxrner_cabinet_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cxrner_forms (
  id uuid primary key default gen_random_uuid(),
  telegram_id text,
  username text,
  artist_name text,
  track_name text,
  genre text,
  release_type text,
  submission_key text not null unique,
  status text not null default 'pending',
  source text not null default 'telegram',
  form_payload jsonb not null default '{}'::jsonb,
  upc text,
  reject_reason text,
  moderation_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cxrner_forms_telegram_id_idx on public.cxrner_forms (telegram_id);
create index if not exists cxrner_forms_created_at_idx on public.cxrner_forms (created_at desc);

insert into public.featured_release (id, title, artist, cover)
values ('current', 'Neon Drift', 'KAZUMAI', '/images/album-01.svg')
on conflict (id) do nothing;

alter table public.featured_release enable row level security;
alter table public.releases_config enable row level security;
alter table public.artists_config enable row level security;
alter table public.cxrner_cabinet_users enable row level security;
alter table public.cxrner_forms enable row level security;

drop policy if exists "public can read featured" on public.featured_release;
create policy "public can read featured" on public.featured_release for select to anon, authenticated using (true);

drop policy if exists "public can read releases config" on public.releases_config;
create policy "public can read releases config" on public.releases_config for select to anon, authenticated using (true);

drop policy if exists "public can read artists config" on public.artists_config;
create policy "public can read artists config" on public.artists_config for select to anon, authenticated using (true);

drop policy if exists "users can read own profile" on public.cxrner_cabinet_users;
create policy "users can read own profile" on public.cxrner_cabinet_users for select to authenticated using (user_id = auth.uid());

drop policy if exists "users can create own profile" on public.cxrner_cabinet_users;
create policy "users can create own profile" on public.cxrner_cabinet_users for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "users can update own profile" on public.cxrner_cabinet_users;
create policy "users can update own profile" on public.cxrner_cabinet_users for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users can read own forms" on public.cxrner_forms;
create policy "users can read own forms" on public.cxrner_forms for select to authenticated using (telegram_id = auth.uid()::text);

drop policy if exists "users can create own forms" on public.cxrner_forms;
create policy "users can create own forms" on public.cxrner_forms for insert to authenticated with check (telegram_id = auth.uid()::text);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cxrner_forms') then
    alter publication supabase_realtime add table public.cxrner_forms;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do update set public = true;
