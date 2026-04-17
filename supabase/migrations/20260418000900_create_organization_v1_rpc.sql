-- ============================================================
-- 20260418000900_create_organization_v1_rpc.sql
--
-- Atomic RPC for creating an organization with an initial admin
-- membership. Wraps organizations + organization_memberships +
-- moderation_event in a single implicit transaction so the three
-- writes are all-or-nothing.
--
-- SECURITY DEFINER (not INVOKER): the moderation_event table
-- has no insert RLS policy — writes are restricted to trusted
-- RPCs only. Using SECURITY DEFINER lets us bypass that gap
-- while still enforcing the caller identity explicitly via
-- the `auth.uid() is not null` guard at the top of the body.
-- The organizations and organization_memberships inserts use
-- columns that tie directly to auth.uid() (created_by, user_id),
-- matching the existing RLS with-check constraints, so there
-- is no privilege escalation risk beyond the moderation_event
-- table which has no user-facing data sensitivity.
-- ============================================================

create or replace function public.create_organization_v1(
  p_name        text,
  p_slug        text,
  p_description text default null,
  p_website     text default null
) returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_org public.organizations;
begin
  -- 1. Auth guard
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  -- 2. Insert organization
  insert into public.organizations (
    name,
    slug,
    description,
    website,
    created_by,
    verification_status
  ) values (
    p_name,
    p_slug,
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_website, '')), ''),
    v_uid,
    'unverified'
  )
  returning * into v_org;

  -- 3. Create admin membership for the creator
  insert into public.organization_memberships (
    organization_id,
    user_id,
    role,
    membership_status
  ) values (
    v_org.id,
    v_uid,
    'admin',
    'active'
  );

  -- 4. Write audit row to moderation_event
  --    action = 'submitted' marks initial creation;
  --    reviewer_id = creator's uid (submission audit, not a moderation decision)
  insert into public.moderation_event (
    target_type,
    target_id,
    reviewer_id,
    action,
    decision,
    notes,
    before_status,
    after_status,
    metadata
  ) values (
    'organization',
    v_org.id,
    v_uid,
    'submitted',
    null,
    null,
    null,
    'unverified',
    jsonb_build_object('name', p_name, 'slug', p_slug)
  );

  -- 5. Return the full organizations row
  return v_org;
end;
$$;

grant execute on function public.create_organization_v1(text, text, text, text) to authenticated;
