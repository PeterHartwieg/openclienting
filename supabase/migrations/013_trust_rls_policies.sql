-- ============================================================
-- OpenClienting.org — RLS Policies for Trust Tables
-- ============================================================

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

-- Verified organizations are public; pending/unverified visible to creator and mods
create policy "organizations_select" on public.organizations for select
  using (
    verification_status = 'verified'
    or created_by = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- Authenticated users can create organizations
create policy "organizations_insert" on public.organizations for insert
  with check (auth.uid() is not null and created_by = auth.uid());

-- Creator or mods can update (e.g. re-submit for verification)
create policy "organizations_update" on public.organizations for update
  using (
    created_by = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- ============================================================
-- ORGANIZATION MEMBERSHIPS
-- ============================================================

-- Members see their own; org admins see org's memberships; mods see all
create policy "memberships_select" on public.organization_memberships for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.organization_memberships om
      where om.organization_id = organization_memberships.organization_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and om.membership_status = 'active'
    )
    or public.get_user_role() in ('moderator', 'admin')
  );

-- Authenticated users can request membership
create policy "memberships_insert" on public.organization_memberships for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- Org admins and mods can update membership status
create policy "memberships_update" on public.organization_memberships for update
  using (
    exists (
      select 1 from public.organization_memberships om
      where om.organization_id = organization_memberships.organization_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
        and om.membership_status = 'active'
    )
    or public.get_user_role() in ('moderator', 'admin')
  );

-- ============================================================
-- VERIFICATION REVIEWS
-- ============================================================

-- Only moderators/admins can see and create reviews
create policy "verification_reviews_select" on public.verification_reviews for select
  using (public.get_user_role() in ('moderator', 'admin'));

create policy "verification_reviews_insert" on public.verification_reviews for insert
  with check (
    public.get_user_role() in ('moderator', 'admin')
    and reviewer_id = auth.uid()
  );

-- ============================================================
-- CONTENT REVISIONS
-- ============================================================

-- Authors see their own revisions; moderators see all
create policy "content_revisions_select" on public.content_revisions for select
  using (
    author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- Authors can create revisions (via server actions)
create policy "content_revisions_insert" on public.content_revisions for insert
  with check (auth.uid() is not null and author_id = auth.uid());

-- Only moderators can update revision status (approve/revert)
create policy "content_revisions_update" on public.content_revisions for update
  using (public.get_user_role() in ('moderator', 'admin'));
