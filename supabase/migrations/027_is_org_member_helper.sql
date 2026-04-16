-- ============================================================
-- 027_is_org_member_helper.sql
-- Fix P1 from PROJECT_REVIEW_SUMMARY: contribution actions accept
-- organizationId from the client and write it to author_organization_id
-- without confirming the user is an active member of that org. A
-- malicious user could attribute work to any org, including a verified
-- one.
--
-- Strategy: introduce is_org_member() mirroring is_org_admin() (015),
-- then add WITH CHECK to each relevant INSERT policy requiring that
-- author_organization_id is null OR the user is an active member.
-- ============================================================

create or replace function public.is_org_member(p_org_id uuid, p_user_id uuid)
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
      and membership_status = 'active'
  );
$$;

grant execute on function public.is_org_member(uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- Problem templates
-- ------------------------------------------------------------
drop policy if exists "problems_insert" on public.problem_templates;
create policy "problems_insert"
  on public.problem_templates for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (
      author_organization_id is null
      or public.is_org_member(author_organization_id, auth.uid())
    )
  );

-- ------------------------------------------------------------
-- Requirements
-- ------------------------------------------------------------
drop policy if exists "requirements_insert" on public.requirements;
create policy "requirements_insert"
  on public.requirements for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (
      author_organization_id is null
      or public.is_org_member(author_organization_id, auth.uid())
    )
  );

-- ------------------------------------------------------------
-- Pilot frameworks
-- ------------------------------------------------------------
drop policy if exists "pilot_frameworks_insert" on public.pilot_frameworks;
create policy "pilot_frameworks_insert"
  on public.pilot_frameworks for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (
      author_organization_id is null
      or public.is_org_member(author_organization_id, auth.uid())
    )
  );

-- ------------------------------------------------------------
-- Solution approaches
-- ------------------------------------------------------------
drop policy if exists "solution_approaches_insert" on public.solution_approaches;
create policy "solution_approaches_insert"
  on public.solution_approaches for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (
      author_organization_id is null
      or public.is_org_member(author_organization_id, auth.uid())
    )
  );

-- ------------------------------------------------------------
-- Comments
-- ------------------------------------------------------------
drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert"
  on public.comments for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and (
      author_organization_id is null
      or public.is_org_member(author_organization_id, auth.uid())
    )
  );
