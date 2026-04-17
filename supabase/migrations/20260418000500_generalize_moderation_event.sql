-- ============================================================
-- 20260418000500_generalize_moderation_event.sql
--
-- Rename verification_reviews → moderation_event and widen the
-- schema to cover all content types and moderation actions.
--
-- Gotcha: Postgres keeps old FK constraint names after a table
-- rename. PostgREST joins using the original FK name
-- (verification_reviews_reviewer_id_fkey) still work — leave them.
-- ============================================================

-- 1. Rename table
alter table public.verification_reviews rename to moderation_event;

-- 2. Drop old target_type CHECK constraint and re-add with widened set
alter table public.moderation_event
  drop constraint if exists verification_reviews_target_type_check;

alter table public.moderation_event
  add constraint moderation_event_target_type_check
  check (target_type in (
    'organization',
    'membership',
    'problem_template',
    'requirement',
    'pilot_framework',
    'solution_approach',
    'success_report',
    'knowledge_article',
    'organization_membership',
    'suggested_edit'
  ));

-- 3. Drop old decision CHECK so we can relax it for back-compat
--    (decision stays nullable; action carries the canonical verb)
alter table public.moderation_event
  drop constraint if exists verification_reviews_decision_check;

-- Keep decision nullable for back-compat; no new check needed

-- 4. Add new columns
alter table public.moderation_event
  add column if not exists action text,
  add column if not exists before_status text,
  add column if not exists after_status text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- 5. Backfill action from decision for existing rows
update public.moderation_event set action = decision where action is null;

-- 6. Now enforce action NOT NULL (all rows have it)
alter table public.moderation_event
  alter column action set not null;

-- 7. Add CHECK on action for allowed verbs
alter table public.moderation_event
  add constraint moderation_event_action_check
  check (action in (
    'submitted',
    'approved',
    'rejected',
    'reverted',
    'edited',
    'verified',
    'unverified',
    'draft_saved',
    'published'
  ));

-- 8. Rebuild indexes with new name convention
--    Drop old ones (auto-renamed? No — index names don't change on table rename)
drop index if exists idx_verification_reviews_target;
drop index if exists idx_verification_reviews_reviewer;

create index if not exists moderation_event_target_idx
  on public.moderation_event (target_type, target_id, created_at desc);

create index if not exists moderation_event_actor_idx
  on public.moderation_event (reviewer_id, created_at desc);

-- 9. RLS — drop old policies (they were carried over under old names)
drop policy if exists "verification_reviews_select" on public.moderation_event;
drop policy if exists "verification_reviews_insert" on public.moderation_event;

-- Moderators/admins can read all events
create policy "moderation_event_mod_read"
  on public.moderation_event
  for select
  using (public.is_moderator_or_admin());

-- Public can read events on published problem_templates
create policy "moderation_event_public_read"
  on public.moderation_event
  for select
  using (
    target_type = 'problem_template'
    and exists (
      select 1 from public.problem_templates pt
      where pt.id = moderation_event.target_id
        and pt.status = 'published'
    )
  );

-- No insert/update/delete policies — writes happen only inside
-- SECURITY INVOKER RPCs where the moderator's own row privileges apply.
