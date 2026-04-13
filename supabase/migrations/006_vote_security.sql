-- ============================================================
-- OpenClienting.org — Vote security hardening
-- ============================================================

-- (a) Restrict vote reads to the voter and moderators/admins
drop policy "votes_select" on public.votes;
create policy "votes_select" on public.votes for select
  using (
    user_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- (b) Only allow votes on published, existing targets
drop policy "votes_insert" on public.votes;
create policy "votes_insert" on public.votes for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and (
      (target_type = 'requirement' and exists (
        select 1 from public.requirements r
        where r.id = target_id and r.status = 'published'
      ))
      or
      (target_type = 'pilot_framework' and exists (
        select 1 from public.pilot_frameworks pf
        where pf.id = target_id and pf.status = 'published'
      ))
    )
  );
