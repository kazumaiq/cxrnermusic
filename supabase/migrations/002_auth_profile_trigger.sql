-- Creates a cabinet profile immediately after Supabase Auth creates a user.
-- This is required when email confirmation is enabled: signUp returns no session,
-- so the browser cannot insert into the protected profile table yet.

create or replace function public.handle_new_cxrner_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.cxrner_cabinet_users (user_id, profile)
  values (
    new.id,
    jsonb_strip_nulls(jsonb_build_object('artist_name', new.raw_user_meta_data ->> 'artist_name'))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_cxrner on auth.users;
create trigger on_auth_user_created_cxrner
  after insert on auth.users
  for each row execute procedure public.handle_new_cxrner_user();
