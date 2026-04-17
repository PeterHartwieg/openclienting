-- ============================================================
-- 20260418000400_is_moderator_or_admin_helper.sql
--
-- SECURITY DEFINER boolean helper for moderator/admin checks.
-- SECURITY DEFINER (not INVOKER) to avoid RLS recursion when
-- called from policies — profiles table is itself RLS-protected
-- and a SECURITY INVOKER function would recurse infinitely.
-- ============================================================

create or replace function public.is_moderator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

grant execute on function public.is_moderator_or_admin() to authenticated, anon;
