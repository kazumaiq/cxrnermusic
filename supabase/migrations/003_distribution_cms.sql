-- CXRNER MUSIC — UNIFIED DISTRIBUTION & MODERATION CMS MIGRATION
-- Safely adds moderation comment, action history timeline, soft delete and indexing

-- 1. Safely add columns to public.cxrner_forms
alter table public.cxrner_forms
  add column if not exists moderator_comment text,
  add column if not exists action_history jsonb not null default '[]'::jsonb,
  add column if not exists user_deleted boolean not null default false,
  add column if not exists moderation_chat_id text default '-1002117586464';

-- 2. Indexes for instant lookup, filtering and pagination
create index if not exists cxrner_forms_status_idx on public.cxrner_forms (status);
create index if not exists cxrner_forms_upc_idx on public.cxrner_forms (upc) where upc is not null;
create index if not exists cxrner_forms_user_deleted_idx on public.cxrner_forms (user_deleted);
create index if not exists cxrner_forms_action_history_idx on public.cxrner_forms using gin (action_history);

-- 3. Row Level Security policies
-- Ensure admins (matching cxrner.label@gmail.com or admin users) have full access
drop policy if exists "admins have full access to cxrner_forms" on public.cxrner_forms;
create policy "admins have full access to cxrner_forms"
  on public.cxrner_forms
  for all
  to authenticated
  using (
    auth.jwt() ->> 'email' in ('cxrner.label@gmail.com', 'kazumaiq@gmail.com', 'kazuma@cxrnermusic.com')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    auth.jwt() ->> 'email' in ('cxrner.label@gmail.com', 'kazumaiq@gmail.com', 'kazuma@cxrnermusic.com')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 4. Enable Supabase Realtime for instant synchronization across Web, Bot, and Artist Cabinet
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'cxrner_forms'
  ) then
    alter publication supabase_realtime add table public.cxrner_forms;
  end if;
end $$;
