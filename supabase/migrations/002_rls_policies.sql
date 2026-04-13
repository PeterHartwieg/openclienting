-- ============================================================
-- OpenClienting.org — Row-Level Security Policies
-- ============================================================

-- Helper: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- ============================================================
-- PROFILES
-- ============================================================

-- Anyone can read profiles (public info)
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Users can insert their own profile (via auth trigger)
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- TAGS
-- ============================================================

-- Anyone can read tags
create policy "tags_select_public"
  on public.tags for select
  using (true);

-- Only moderators/admins can manage tags
create policy "tags_insert_mod"
  on public.tags for insert
  with check (public.get_user_role() in ('moderator', 'admin'));

create policy "tags_update_mod"
  on public.tags for update
  using (public.get_user_role() in ('moderator', 'admin'));

create policy "tags_delete_mod"
  on public.tags for delete
  using (public.get_user_role() in ('moderator', 'admin'));

-- ============================================================
-- PROBLEM TEMPLATES
-- ============================================================

-- Published problems visible to all; own submissions visible to author; all visible to mods
create policy "problems_select"
  on public.problem_templates for select
  using (
    status = 'published'
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- Authenticated users can insert
create policy "problems_insert"
  on public.problem_templates for insert
  with check (auth.uid() is not null and author_id = auth.uid());

-- Author can update own non-published; moderators can update any (for status changes)
create policy "problems_update"
  on public.problem_templates for update
  using (
    (author_id = auth.uid())
    or public.get_user_role() in ('moderator', 'admin')
  );

-- ============================================================
-- PROBLEM TAGS
-- ============================================================

-- Readable if the linked problem is readable (simplified: same as problems)
create policy "problem_tags_select"
  on public.problem_tags for select
  using (
    exists (
      select 1 from public.problem_templates pt
      where pt.id = problem_id
        and (pt.status = 'published' or pt.author_id = auth.uid()
             or public.get_user_role() in ('moderator', 'admin'))
    )
  );

-- Insert follows problem write rules
create policy "problem_tags_insert"
  on public.problem_tags for insert
  with check (
    exists (
      select 1 from public.problem_templates pt
      where pt.id = problem_id
        and (pt.author_id = auth.uid() or public.get_user_role() in ('moderator', 'admin'))
    )
  );

-- Delete follows same rules
create policy "problem_tags_delete"
  on public.problem_tags for delete
  using (
    exists (
      select 1 from public.problem_templates pt
      where pt.id = problem_id
        and (pt.author_id = auth.uid() or public.get_user_role() in ('moderator', 'admin'))
    )
  );

-- ============================================================
-- REQUIREMENTS
-- ============================================================

-- Published requirements visible if problem is published; own visible; mods see all
create policy "requirements_select"
  on public.requirements for select
  using (
    (status = 'published' and exists (
      select 1 from public.problem_templates pt
      where pt.id = problem_id and pt.status = 'published'
    ))
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- Authenticated users can insert requirements
create policy "requirements_insert"
  on public.requirements for insert
  with check (auth.uid() is not null and author_id = auth.uid());

-- Author or moderators can update
create policy "requirements_update"
  on public.requirements for update
  using (
    author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- ============================================================
-- PILOT FRAMEWORKS
-- ============================================================

-- Same pattern as requirements
create policy "pilot_frameworks_select"
  on public.pilot_frameworks for select
  using (
    (status = 'published' and exists (
      select 1 from public.problem_templates pt
      where pt.id = problem_id and pt.status = 'published'
    ))
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

create policy "pilot_frameworks_insert"
  on public.pilot_frameworks for insert
  with check (auth.uid() is not null and author_id = auth.uid());

create policy "pilot_frameworks_update"
  on public.pilot_frameworks for update
  using (
    author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );
