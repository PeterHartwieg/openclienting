-- ============================================================
-- 20260418001600_fix_moderation_event_contract.sql
--
-- Align moderation_event with the generalized moderation model:
-- - decision is optional for non-decision actions like submitted
-- - moderators/admins can insert audit rows from SECURITY INVOKER RPCs
-- ============================================================

alter table public.moderation_event
  alter column decision drop not null;

drop policy if exists "moderation_event_mod_insert" on public.moderation_event;

create policy "moderation_event_mod_insert"
  on public.moderation_event
  for insert
  with check (
    public.is_moderator_or_admin()
    and reviewer_id = auth.uid()
  );

