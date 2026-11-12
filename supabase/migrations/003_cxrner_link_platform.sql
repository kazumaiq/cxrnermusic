-- =========================================================================
-- MIGRATION 003: CXRNER LINK PLATFORM
-- Music Smart Links & Pre-save Platform Engine for CXRNER MUSIC
-- =========================================================================

create extension if not exists pgcrypto;

-- 1. SMART LINKS TABLE
create table if not exists public.smart_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text not null,
  cover_url text not null,
  slug text not null unique,
  upc text,
  isrc text,
  release_date timestamptz,
  release_type text not null default 'single',
  genre text,
  label_name text not null default 'CXRNER MUSIC',
  description text,
  status text not null default 'published', -- 'draft', 'published', 'archived'
  is_out_now boolean not null default false,
  auto_out_now boolean not null default true,
  template text not null default 'CYBER', -- 'MINIMAL', 'CYBER', 'CINEMATIC', 'BRUTAL'
  design_config jsonb not null default '{
    "theme": "CYBER",
    "background_type": "blur",
    "background_color": "#090611",
    "accent_color": "#8737FF",
    "cover_blur": 64,
    "button_radius": "full",
    "button_style": "glass",
    "font_family": "sans",
    "show_countdown": true,
    "show_socials": true,
    "show_audio_preview": true
  }'::jsonb,
  social_links jsonb not null default '[]'::jsonb,
  extra_content jsonb not null default '{}'::jsonb,
  presave_enabled boolean not null default true,
  views_count integer not null default 0,
  clicks_count integer not null default 0,
  presaves_count integer not null default 0,
  is_verified_artist boolean not null default false,
  deleted_at timestamptz default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. SMART LINK PLATFORMS TABLE (Streaming services per Smart Link)
create table if not exists public.smart_link_platforms (
  id uuid primary key default gen_random_uuid(),
  smart_link_id uuid not null references public.smart_links(id) on delete cascade,
  platform_key text not null, -- 'yandex', 'vk', 'spotify', 'apple', 'youtube', 'deezer', 'zvuk', 'tidal', 'soundcloud'
  platform_name text not null,
  url text not null,
  button_text text not null default 'Слушать',
  display_order integer not null default 0,
  is_enabled boolean not null default true,
  clicks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. SLUG HISTORY TABLE (For automatic 301 redirects when slug is renamed)
create table if not exists public.slug_history (
  id uuid primary key default gen_random_uuid(),
  smart_link_id uuid not null references public.smart_links(id) on delete cascade,
  old_slug text not null unique,
  new_slug text not null,
  created_at timestamptz not null default now()
);

-- 4. SMART LINK ANALYTICS TABLE (Granular clickstream & views)
create table if not exists public.smart_link_analytics (
  id uuid primary key default gen_random_uuid(),
  smart_link_id uuid not null references public.smart_links(id) on delete cascade,
  event_type text not null, -- 'view', 'click', 'presave'
  platform_key text,
  visitor_hash text,
  referrer text,
  country text default 'RU',
  device text default 'desktop', -- 'desktop', 'mobile', 'tablet'
  browser text,
  created_at timestamptz not null default now()
);

-- 5. PRE-SAVE SUBSCRIBERS TABLE (Fan email & Telegram registrations)
create table if not exists public.presave_subscribers (
  id uuid primary key default gen_random_uuid(),
  smart_link_id uuid not null references public.smart_links(id) on delete cascade,
  email text,
  telegram_chat_id text,
  preferred_platform text default 'yandex',
  status text not null default 'pending', -- 'pending', 'notified', 'failed'
  created_at timestamptz not null default now()
);

-- 6. SYSTEM LOGS TABLE (Audit trail for automated Out Now and admin actions)
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =========================================================================
create index if not exists smart_links_user_id_idx on public.smart_links (user_id);
create index if not exists smart_links_slug_idx on public.smart_links (slug) where deleted_at is null;
create index if not exists smart_links_status_idx on public.smart_links (status);
create index if not exists smart_links_release_date_idx on public.smart_links (release_date);
create index if not exists smart_link_platforms_link_idx on public.smart_link_platforms (smart_link_id, display_order);
create index if not exists slug_history_old_slug_idx on public.slug_history (old_slug);
create index if not exists smart_link_analytics_link_idx on public.smart_link_analytics (smart_link_id, created_at desc);
create index if not exists smart_link_analytics_type_idx on public.smart_link_analytics (event_type);
create index if not exists presave_subscribers_link_idx on public.presave_subscribers (smart_link_id);
create index if not exists system_logs_created_idx on public.system_logs (created_at desc);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
alter table public.smart_links enable row level security;
alter table public.smart_link_platforms enable row level security;
alter table public.slug_history enable row level security;
alter table public.smart_link_analytics enable row level security;
alter table public.presave_subscribers enable row level security;
alter table public.system_logs enable row level security;

-- SMART LINKS POLICIES
-- Public can view active published links that are not soft-deleted
drop policy if exists "public_view_published_links" on public.smart_links;
create policy "public_view_published_links" on public.smart_links
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

-- Authenticated users can view their own links (even drafts or archived)
drop policy if exists "users_view_own_links" on public.smart_links;
create policy "users_view_own_links" on public.smart_links
  for select to authenticated
  using (user_id = auth.uid());

-- Authenticated users can insert their own links
drop policy if exists "users_insert_own_links" on public.smart_links;
create policy "users_insert_own_links" on public.smart_links
  for insert to authenticated
  with check (user_id = auth.uid());

-- Authenticated users can update their own links
drop policy if exists "users_update_own_links" on public.smart_links;
create policy "users_update_own_links" on public.smart_links
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Authenticated users can delete their own links
drop policy if exists "users_delete_own_links" on public.smart_links;
create policy "users_delete_own_links" on public.smart_links
  for delete to authenticated
  using (user_id = auth.uid());

-- SMART LINK PLATFORMS POLICIES
-- Public can view platforms for published links
drop policy if exists "public_view_platforms" on public.smart_link_platforms;
create policy "public_view_platforms" on public.smart_link_platforms
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_platforms.smart_link_id
        and smart_links.status = 'published'
        and smart_links.deleted_at is null
    )
  );

-- Link owners can view all platforms of their links
drop policy if exists "users_view_own_platforms" on public.smart_link_platforms;
create policy "users_view_own_platforms" on public.smart_link_platforms
  for select to authenticated
  using (
    exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_platforms.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  );

-- Link owners can insert platforms
drop policy if exists "users_insert_own_platforms" on public.smart_link_platforms;
create policy "users_insert_own_platforms" on public.smart_link_platforms
  for insert to authenticated
  with check (
    exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_platforms.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  );

-- Link owners can update platforms
drop policy if exists "users_update_own_platforms" on public.smart_link_platforms;
create policy "users_update_own_platforms" on public.smart_link_platforms
  for update to authenticated
  using (
    exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_platforms.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_platforms.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  );

-- Link owners can delete platforms
drop policy if exists "users_delete_own_platforms" on public.smart_link_platforms;
create policy "users_delete_own_platforms" on public.smart_link_platforms
  for delete to authenticated
  using (
    exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_platforms.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  );

-- SLUG HISTORY POLICIES
drop policy if exists "public_view_slug_history" on public.slug_history;
create policy "public_view_slug_history" on public.slug_history
  for select to anon, authenticated using (true);

drop policy if exists "users_insert_slug_history" on public.slug_history;
create policy "users_insert_slug_history" on public.slug_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.smart_links
      where smart_links.id = slug_history.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  );

-- ANALYTICS POLICIES
-- Anyone (server/client) can record an event
drop policy if exists "allow_insert_analytics" on public.smart_link_analytics;
create policy "allow_insert_analytics" on public.smart_link_analytics
  for insert to anon, authenticated with check (true);

-- Only link owners can view analytics
drop policy if exists "users_view_own_analytics" on public.smart_link_analytics;
create policy "users_view_own_analytics" on public.smart_link_analytics
  for select to authenticated
  using (
    exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_analytics.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  );

-- PRE-SAVE SUBSCRIBERS POLICIES
-- Anyone can subscribe to a pre-save
drop policy if exists "allow_insert_presaves" on public.presave_subscribers;
create policy "allow_insert_presaves" on public.presave_subscribers
  for insert to anon, authenticated with check (true);

-- Only link owners can view their subscribers
drop policy if exists "users_view_own_presaves" on public.presave_subscribers;
create policy "users_view_own_presaves" on public.presave_subscribers
  for select to authenticated
  using (
    exists (
      select 1 from public.smart_links
      where smart_links.id = presave_subscribers.smart_link_id
        and smart_links.user_id = auth.uid()
    )
  );

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public)
values ('smart-links', 'smart-links', true)
on conflict (id) do update set public = true;

-- Storage policies for smart-links bucket
drop policy if exists "public_read_smart_link_covers" on storage.objects;
create policy "public_read_smart_link_covers" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'smart-links');

drop policy if exists "authenticated_upload_smart_link_covers" on storage.objects;
create policy "authenticated_upload_smart_link_covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'smart-links');

drop policy if exists "authenticated_update_smart_link_covers" on storage.objects;
create policy "authenticated_update_smart_link_covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'smart-links' and auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =========================================================================

-- Trigger to update updated_at automatically
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_smart_link_updated on public.smart_links;
create trigger on_smart_link_updated
  before update on public.smart_links
  for each row execute procedure public.handle_updated_at();

-- Automated function to process Out Now state
create or replace function public.process_auto_out_now()
returns integer language plpgsql security definer as $$
declare
  updated_count integer;
begin
  update public.smart_links
  set is_out_now = true
  where auto_out_now = true
    and is_out_now = false
    and release_date is not null
    and release_date <= now()
    and status = 'published'
    and deleted_at is null;

  get diagnostics updated_count = row_count;

  -- Also update button texts for platforms belonging to newly released links
  update public.smart_link_platforms
  set button_text = 'Слушать'
  where button_text = 'Pre-save'
    and exists (
      select 1 from public.smart_links
      where smart_links.id = smart_link_platforms.smart_link_id
        and smart_links.is_out_now = true
    );

  return updated_count;
end;
$$;
