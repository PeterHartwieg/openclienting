-- ============================================================
-- Fix infinite recursion in organization_memberships RLS
-- The select/update policies queried organization_memberships
-- from within its own RLS policy, causing recursion.
-- Solution: SECURITY DEFINER helper that bypasses RLS.
-- ============================================================

-- Helper: check if user is an active admin of a given org (bypasses RLS)
create or replace function public.is_org_admin(p_org_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = p_org_id
      and user_id = p_user_id
      and role = 'admin'
      and membership_status = 'active'
  );
$$;

-- Drop old policies
drop policy if exists "memberships_select" on public.organization_memberships;
drop policy if exists "memberships_update" on public.organization_memberships;

-- Recreate without self-referencing subquery
create policy "memberships_select" on public.organization_memberships for select
  using (
    user_id = auth.uid()
    or public.is_org_admin(organization_id, auth.uid())
    or public.get_user_role() in ('moderator', 'admin')
  );

create policy "memberships_update" on public.organization_memberships for update
  using (
    public.is_org_admin(organization_id, auth.uid())
    or public.get_user_role() in ('moderator', 'admin')
  );
