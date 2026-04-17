-- ============================================================
-- 20260418001300_ensure_system_org_v1_rpc.sql
--
-- Deduplication-safe RPC for creating or matching a system-managed
-- organization. Called by import_curated_problem_v1 and usable
-- directly by admin/moderator users.
--
-- Deduplication priority (first match wins):
--   1. Explicit organization_id in payload → use that org
--   2. Normalized website match (strips protocol + www + trailing /)
--   3. Case-insensitive name match
--   4. None matched → create new system-managed org
--
-- When matching an existing org (cases 1–3), the system profile
-- is added as an active admin member via upsert if not already.
-- Existing memberships of real users are never modified.
--
-- Auth:
--   Regular callers: must be admin or moderator (auth.uid() set).
--   Service-role callers (auth.uid() IS NULL): must supply
--     _service_caller_id in the payload — a profile UUID that must
--     exist with role in ('moderator','admin'). Used for audit trail.
--
-- SECURITY DEFINER: required because moderation_event has no insert
-- RLS policy and because organization_memberships insert RLS ties
-- user_id to auth.uid(), which differs from the system profile UUID.
-- ============================================================

create or replace function public.ensure_system_org_v1(p_payload jsonb)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Well-known system profile UUID (matches 20260418001000)
  system_profile_id constant uuid := '00000000-0000-0000-0000-000000000001';

  v_caller_uid   uuid;
  v_org          public.organizations;
  v_org_id       uuid;
  v_name         text;
  v_website      text;   -- raw, stored as-is
  v_website_norm text;   -- stripped for dedup comparison
  v_description  text;
  v_slug         text;
  v_slug_base    text;
  v_counter      int;
begin
  -- ── Auth guard ──────────────────────────────────────────────
  v_caller_uid := auth.uid();

  if v_caller_uid is null then
    -- Service-role context: require explicit caller id for audit
    v_caller_uid := nullif(trim(p_payload->>'_service_caller_id'), '')::uuid;
    if v_caller_uid is null then
      raise exception 'authentication required; '
        'supply _service_caller_id in payload when using service role';
    end if;
    if not exists (
      select 1 from public.profiles
      where id = v_caller_uid
        and role in ('moderator', 'admin')
    ) then
      raise exception 'permission denied: _service_caller_id must be a moderator or admin';
    end if;
  else
    if not is_moderator_or_admin() then
      raise exception 'permission denied: admin or moderator required';
    end if;
  end if;

  -- ── Extract fields ──────────────────────────────────────────
  v_name        := nullif(trim(p_payload->>'name'), '');
  v_website     := nullif(trim(p_payload->>'website'), '');
  v_description := nullif(trim(p_payload->>'description'), '');
  v_org_id      := nullif(trim(p_payload->>'organization_id'), '')::uuid;

  if v_name is null then
    raise exception 'organization name is required';
  end if;

  -- Normalize website for dedup: strip protocol, www., trailing slashes
  if v_website is not null then
    v_website_norm := lower(
      regexp_replace(
        regexp_replace(v_website, '^https?://(www\.)?', '', 'i'),
        '/+$', ''
      )
    );
  end if;

  -- ── 1. Match by explicit organization_id ───────────────────
  if v_org_id is not null then
    select * into v_org from public.organizations where id = v_org_id;
    if found then
      insert into public.organization_memberships
        (organization_id, user_id, role, membership_status)
      values
        (v_org.id, system_profile_id, 'admin', 'active')
      on conflict (organization_id, user_id) do nothing;
      return v_org;
    end if;
  end if;

  -- ── 2. Match by normalized website ─────────────────────────
  if v_website_norm is not null then
    select * into v_org from public.organizations
    where lower(
        regexp_replace(
          regexp_replace(website, '^https?://(www\.)?', '', 'i'),
          '/+$', ''
        )
      ) = v_website_norm
    limit 1;
    if found then
      insert into public.organization_memberships
        (organization_id, user_id, role, membership_status)
      values
        (v_org.id, system_profile_id, 'admin', 'active')
      on conflict (organization_id, user_id) do nothing;
      return v_org;
    end if;
  end if;

  -- ── 3. Match by case-insensitive name ──────────────────────
  select * into v_org from public.organizations
  where lower(trim(name)) = lower(v_name)
  limit 1;
  if found then
    insert into public.organization_memberships
      (organization_id, user_id, role, membership_status)
    values
      (v_org.id, system_profile_id, 'admin', 'active')
    on conflict (organization_id, user_id) do nothing;
    return v_org;
  end if;

  -- ── 4. Create new system-managed org ──────────────────────
  -- Slug: lowercase, non-alphanumeric → hyphen, de-duplicated
  v_slug_base := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
  v_slug_base := regexp_replace(v_slug_base, '^-+|-+$', '', 'g');
  v_slug      := v_slug_base;
  v_counter   := 1;

  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_slug    := v_slug_base || '-' || v_counter;
    v_counter := v_counter + 1;
  end loop;

  insert into public.organizations (
    name, slug, description, website,
    created_by, verification_status, is_system_managed
  ) values (
    v_name, v_slug, v_description, v_website,
    system_profile_id, 'unverified', true
  )
  returning * into v_org;

  -- System profile as active admin member
  insert into public.organization_memberships
    (organization_id, user_id, role, membership_status)
  values
    (v_org.id, system_profile_id, 'admin', 'active');

  -- Audit trail
  insert into public.moderation_event (
    target_type, target_id, reviewer_id,
    action, before_status, after_status, metadata
  ) values (
    'organization', v_org.id, v_caller_uid,
    'submitted', null, 'unverified',
    jsonb_build_object(
      'name',           v_name,
      'slug',           v_slug,
      'system_managed', true
    )
  );

  return v_org;
end;
$$;

grant execute on function public.ensure_system_org_v1(jsonb) to authenticated;
