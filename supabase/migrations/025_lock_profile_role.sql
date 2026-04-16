-- ============================================================
-- 025_lock_profile_role.sql
-- Fix P0 from PROJECT_REVIEW_SUMMARY: users could update their own
-- profiles.role via the broad profiles_update_own RLS policy, trivially
-- escalating to admin and bypassing every get_user_role()-based check.
--
-- Strategy: keep role on profiles (so RLS helpers stay untouched) but
-- block mutation via a BEFORE UPDATE trigger. The trigger raises unless
-- the caller is the service role — role changes only happen via the
-- service-role client (admin tooling, not end-user paths).
-- ============================================================

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  if new.role is distinct from old.role then
    -- request.jwt.claims is empty when no JWT is attached (direct SQL via
    -- supabase-js service client). In that case we're running as the
    -- service role and must allow the change.
    begin
      jwt_role := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
    exception when others then
      jwt_role := null;
    end;

    if jwt_role is not null and jwt_role <> 'service_role' then
      raise exception 'role changes are not permitted via end-user sessions'
        using errcode = '42501'; -- insufficient_privilege
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;

create trigger prevent_profile_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_profile_role_change();
