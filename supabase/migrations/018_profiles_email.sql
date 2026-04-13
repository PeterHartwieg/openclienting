-- Add email to profiles so moderators can see who is requesting verification.
-- auth.users is only accessible server-side with service role; storing a copy
-- in profiles lets PostgREST joins work normally under RLS.

alter table public.profiles
  add column email text;

-- Backfill from auth.users
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

-- Keep email in sync on new signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    'contributor',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;
