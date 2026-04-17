-- ============================================================
-- 20260418001200_system_managed_orgs.sql
--
-- Adds is_system_managed flag to organizations.
--
-- System-managed organizations represent real-world entities
-- that have no associated user account. They are created and
-- administered by the system profile via ensure_system_org_v1.
--
-- These orgs are publicly readable regardless of their
-- verification_status because:
--   - They exist to support curated-content display, not to
--     assert user-identity trust.
--   - Their real-world identity is backed by editorial citations,
--     not by the Supabase verification workflow.
--
-- The "Verified" badge in the UI should NOT appear for
-- is_system_managed=true orgs — the UI should treat them as
-- "Editorial" orgs. This migration only handles data visibility;
-- UI badge logic is a separate concern.
-- ============================================================

alter table public.organizations
  add column is_system_managed boolean not null default false;

comment on column public.organizations.is_system_managed is
  'true = created by the editorial system (system profile) for curated content; '
  'no real user admin. Does not imply platform verification — real-world identity '
  'is backed by content_citations on the associated problems.';

-- Public read policy for system-managed orgs.
-- Existing policies cover: verified orgs, creator, mods/admins.
-- This policy handles the editorial org case.
-- RLS SELECT policies are OR-combined, so this adds to the
-- existing visibility without overriding it.
create policy "public_reads_system_managed_orgs"
  on public.organizations
  for select
  using (is_system_managed = true);
