-- ============================================================
-- 026_move_profile_email_private.sql
-- Fix P0 from PROJECT_REVIEW_SUMMARY: migration 018 added profiles.email
-- but the profiles_select_public RLS policy exposes every row publicly,
-- leaking contributor emails via any join.
--
-- Strategy: move email into a private profile_contacts table gated by
-- moderator-only SELECT. handle_new_user trigger inserts into the new
-- table; getPendingVerifications() joins it with a service-role client.
-- ============================================================

-- 1. Private email table
create table public.profile_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.profile_contacts
  for each row execute function public.handle_updated_at();

-- 2. Backfill from the soon-to-be-dropped profiles.email
insert into public.profile_contacts (user_id, email)
  select id, email from public.profiles where email is not null
  on conflict (user_id) do nothing;

-- 3. Drop the public column
alter table public.profiles drop column email;

-- 4. Lock the new table down. Only moderators/admins can read; writes
--    happen via the service-role client (handle_new_user trigger below,
--    admin tooling). No anon/authenticated insert/update/delete policy is
--    added on purpose — RLS denies by default.
alter table public.profile_contacts enable row level security;

create policy "profile_contacts_select_moderator"
  on public.profile_contacts for select
  using (public.get_user_role() in ('moderator', 'admin'));

-- 5. Replace the handle_new_user trigger so email flows to the private
--    table instead of profiles.email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    'contributor'
  );

  if new.email is not null then
    insert into public.profile_contacts (user_id, email)
    values (new.id, new.email)
    on conflict (user_id) do update set email = excluded.email;
  end if;

  return new;
end;
$$;

-- 6. profiles_select_public is unchanged in behaviour (still public
--    read) but we redefine it with a comment so reviewers know email
--    deliberately no longer lives here.
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

comment on policy "profiles_select_public" on public.profiles is
  'Public read of display_name/role. Email moved to profile_contacts (025).';
