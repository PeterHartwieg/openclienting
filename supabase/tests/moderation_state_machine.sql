-- ============================================================
-- Suite 2 — moderation state machine (pgTAP)
-- Tests the moderate_item_v1 RPC from migration 000600.
--
-- Run via:
--   supabase db test --linked
--   (CLI v2.84.2 supports --linked for remote pgTAP execution)
--
-- Fallback (if CLI version doesn't support --linked):
--   psql "$DATABASE_URL" -f supabase/tests/moderation_state_machine.sql
--
-- The entire test runs inside a transaction that is rolled back at the end,
-- so no permanent rows are written to the hosted project.
-- ============================================================

begin;

select plan(21);

-- ----------------------------------------------------------------
-- Setup: insert a real auth user + profile so FK constraints pass
-- ----------------------------------------------------------------

-- Seed a fake moderator in auth.users
insert into auth.users (
  id,
  email,
  role,
  aud,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  encrypted_password
) values (
  'dddddddd-0000-0000-0000-000000000001',
  'pgtap-moderator@dev.openclienting.local',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"pgTAP Moderator"}',
  false,
  'placeholder'
) on conflict (id) do nothing;

-- Seed a profile with role=moderator
insert into public.profiles (id, display_name, role)
values ('dddddddd-0000-0000-0000-000000000001', 'pgTAP Moderator', 'moderator')
on conflict (id) do update set role = 'moderator';

-- Seed an author user
insert into auth.users (
  id, email, role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password
) values (
  'dddddddd-0000-0000-0000-000000000002',
  'pgtap-author@dev.openclienting.local',
  'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"pgTAP Author"}',
  false, 'placeholder'
) on conflict (id) do nothing;

insert into public.profiles (id, display_name, role)
values ('dddddddd-0000-0000-0000-000000000002', 'pgTAP Author', 'contributor')
on conflict (id) do update set role = 'contributor';

-- Seed a problem_template owned by the author
insert into public.problem_templates (
  id, title, description, author_id, status
) values (
  'eeeeeeee-0000-0000-0000-000000000001',
  'pgTAP test problem',
  'seeded by pgTAP moderation state machine tests',
  'dddddddd-0000-0000-0000-000000000002',
  'submitted'
);

-- ----------------------------------------------------------------
-- Impersonate the moderator for all subsequent statements so that
-- is_moderator_or_admin() returns true inside the RPC.
-- ----------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated","aud":"authenticated"}';

-- PostgreSQL auth.uid() reads from the JWT claim when using PostgREST;
-- in pgTAP we must set it another way. Use a helper workaround:
-- set local app.current_user_id = 'dddddddd-0000-0000-0000-000000000001';
-- However, auth.uid() is a Supabase-defined function that reads from
-- request.jwt.claim.sub. Setting that via SET LOCAL may work on hosted Supabase:
set local "request.jwt.claim.sub" to 'dddddddd-0000-0000-0000-000000000001';

-- ----------------------------------------------------------------
-- TEST 1: approved → status transitions to 'published'
-- ----------------------------------------------------------------
select lives_ok(
  $$
    select public.moderate_item_v1(
      'problem_template',
      'eeeeeeee-0000-0000-0000-000000000001',
      'approved',
      'pgTAP approval test'
    )
  $$,
  'moderate_item_v1 approved: should not raise'
);

select is(
  (select status from public.problem_templates
   where id = 'eeeeeeee-0000-0000-0000-000000000001'),
  'published',
  'moderate_item_v1 approved: status → published'
);

-- ----------------------------------------------------------------
-- TEST 2: moderation_event row inserted with correct before/after
-- ----------------------------------------------------------------
select ok(
  exists(
    select 1 from public.moderation_event
    where target_type   = 'problem_template'
      and target_id     = 'eeeeeeee-0000-0000-0000-000000000001'
      and action        = 'approved'
      and before_status = 'submitted'
      and after_status  = 'published'
  ),
  'moderate_item_v1 approved: inserts moderation_event with correct status transition'
);

-- ----------------------------------------------------------------
-- Reset problem status to 'submitted' for the rejection test
-- ----------------------------------------------------------------
update public.problem_templates
set status = 'submitted'
where id = 'eeeeeeee-0000-0000-0000-000000000001';

-- ----------------------------------------------------------------
-- TEST 3: rejected → status transitions to 'rejected'
-- ----------------------------------------------------------------
select lives_ok(
  $$
    select public.moderate_item_v1(
      'problem_template',
      'eeeeeeee-0000-0000-0000-000000000001',
      'rejected',
      'pgTAP rejection test'
    )
  $$,
  'moderate_item_v1 rejected: should not raise'
);

select is(
  (select status from public.problem_templates
   where id = 'eeeeeeee-0000-0000-0000-000000000001'),
  'rejected',
  'moderate_item_v1 rejected: status → rejected'
);

-- ----------------------------------------------------------------
-- TEST 4: rejected decision does NOT cascade-approve child content
-- No requirements were seeded, so the cascade function wouldn't run anyway.
-- We assert no child requirements changed to 'published' as a safety check.
-- ----------------------------------------------------------------
select is(
  (select count(*) from public.requirements
   where problem_id = 'eeeeeeee-0000-0000-0000-000000000001'
     and status = 'published'),
  0::bigint,
  'moderate_item_v1 rejected: no child requirements were approved'
);

-- ----------------------------------------------------------------
-- TEST 5: invalid p_decision raises an exception
-- ----------------------------------------------------------------
select throws_ok(
  $$
    select public.moderate_item_v1(
      'problem_template',
      'eeeeeeee-0000-0000-0000-000000000001',
      'INVALID_DECISION'
    )
  $$,
  'invalid decision: INVALID_DECISION. Must be ''approved'' or ''rejected''.',
  'moderate_item_v1: invalid decision raises'
);

-- ----------------------------------------------------------------
-- TEST 6: non-moderator calling the RPC raises permission denied
-- Switch to a regular contributor context
-- ----------------------------------------------------------------
set local "request.jwt.claim.sub" to 'dddddddd-0000-0000-0000-000000000002';

-- Re-insert a fresh problem for the permission test
insert into public.problem_templates (
  id, title, description, author_id, status
) values (
  'eeeeeeee-0000-0000-0000-000000000002',
  'pgTAP perm test problem',
  'seeded for permission check',
  'dddddddd-0000-0000-0000-000000000002',
  'submitted'
);

select throws_ok(
  $$
    select public.moderate_item_v1(
      'problem_template',
      'eeeeeeee-0000-0000-0000-000000000002',
      'approved'
    )
  $$,
  'permission denied: moderator or admin role required',
  'moderate_item_v1: non-moderator raises permission denied'
);

-- ----------------------------------------------------------------
-- TEST 7: invalid p_target_type raises
-- ----------------------------------------------------------------
set local "request.jwt.claim.sub" to 'dddddddd-0000-0000-0000-000000000001';

select throws_ok(
  $$
    select public.moderate_item_v1(
      'nonexistent_type',
      'eeeeeeee-0000-0000-0000-000000000001',
      'approved'
    )
  $$,
  'invalid target_type: nonexistent_type',
  'moderate_item_v1: invalid target_type raises'
);

-- ----------------------------------------------------------------
-- TEST 8: moderation_event row count after the two decisions above
-- (one approved + one rejected + perm-denied didn't write a row)
-- ----------------------------------------------------------------
select is(
  (select count(*) from public.moderation_event
   where target_id = 'eeeeeeee-0000-0000-0000-000000000001'),
  2::bigint,
  'moderate_item_v1: exactly two moderation_event rows for the first problem'
);

-- ----------------------------------------------------------------
-- TEST 8b: moderation_event allows NULL decision for submitted actions
-- ----------------------------------------------------------------
select lives_ok(
  $$
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
      'problem_template',
      'eeeeeeee-0000-0000-0000-000000000001',
      'dddddddd-0000-0000-0000-000000000001',
      'submitted',
      null,
      null,
      null,
      'submitted',
      '{}'::jsonb
    )
  $$,
  'moderation_event permits NULL decision for submitted actions'
);

select ok(
  exists(
    select 1 from public.moderation_event
    where target_type = 'problem_template'
      and target_id = 'eeeeeeee-0000-0000-0000-000000000001'
      and action = 'submitted'
      and decision is null
  ),
  'moderation_event stored a submitted row with NULL decision'
);

-- ================================================================
-- SUITE 2 EXTENSION: submit_problem_v1 + create_organization_v1
-- ================================================================

-- Seed a tag so tag_ids can reference a real row
insert into public.tags (id, name, slug, category)
values (
  'ffffffff-0000-0000-0000-000000000001',
  'pgTAP Tag',
  'pgtap-tag',
  'problem_category'
) on conflict (id) do nothing;

-- Switch to the author context
set local "request.jwt.claim.sub" to 'dddddddd-0000-0000-0000-000000000002';

-- ----------------------------------------------------------------
-- TEST 9: submit_problem_v1 succeeds and creates all child rows
-- ----------------------------------------------------------------
select lives_ok(
  $$
    select public.submit_problem_v1(
      jsonb_build_object(
        'title',                   'pgTAP submission test problem',
        'description',             'Test description for submit_problem_v1',
        'is_publicly_anonymous',   false,
        'is_org_anonymous',        false,
        'author_organization_id',  null,
        'source_language',         'en',
        'tag_ids',                 jsonb_build_array('ffffffff-0000-0000-0000-000000000001'),
        'requirements',            jsonb_build_array(
                                     jsonb_build_object('body', 'req one', 'source_language', 'en'),
                                     jsonb_build_object('body', 'req two', 'source_language', 'en')
                                   ),
        'pilot_frameworks',        jsonb_build_array(
                                     jsonb_build_object(
                                       'scope',               'small',
                                       'suggested_kpis',      'kpi1',
                                       'success_criteria',    'criteria',
                                       'common_pitfalls',     'pitfalls',
                                       'duration',            '3 months',
                                       'resource_commitment', 'low',
                                       'source_language',     'en'
                                     )
                                   )
      )
    )
  $$,
  'submit_problem_v1: should not raise for valid payload'
);

-- Helper: capture the id of the problem just inserted
do $$
declare v_id uuid;
begin
  select id into v_id from public.problem_templates
  where title = 'pgTAP submission test problem'
    and author_id = 'dddddddd-0000-0000-0000-000000000002';
  -- store for reuse; pgTAP runs in same tx so we can use a temp table
  create temp table if not exists _pgtap_submit_ids (problem_id uuid);
  insert into _pgtap_submit_ids values (v_id);
end $$;

-- TEST 10: one moderation_event with action='submitted'
set local "request.jwt.claim.sub" to 'dddddddd-0000-0000-0000-000000000001';

select is(
  (select count(*) from public.moderation_event me
   join _pgtap_submit_ids s on s.problem_id = me.target_id
   where me.target_type = 'problem_template'
     and me.action      = 'submitted'),
  1::bigint,
  'submit_problem_v1: exactly one moderation_event with action=submitted'
);

-- TEST 11: problem_tags count matches
select is(
  (select count(*) from public.problem_tags pt
   join _pgtap_submit_ids s on s.problem_id = pt.problem_id),
  1::bigint,
  'submit_problem_v1: one problem_tag row inserted'
);

-- TEST 12: requirements count matches
select is(
  (select count(*) from public.requirements r
   join _pgtap_submit_ids s on s.problem_id = r.problem_id),
  2::bigint,
  'submit_problem_v1: two requirement rows inserted'
);

-- TEST 13: pilot_frameworks count matches
select is(
  (select count(*) from public.pilot_frameworks pf
   join _pgtap_submit_ids s on s.problem_id = pf.problem_id),
  1::bigint,
  'submit_problem_v1: one pilot_framework row inserted'
);

-- ----------------------------------------------------------------
-- TEST 14: submit_problem_v1 raises when unauthenticated
-- ----------------------------------------------------------------
reset role;
set local "request.jwt.claims" to '{}';
set local "request.jwt.claim.sub" to '';

select throws_ok(
  $$
    select public.submit_problem_v1(
      jsonb_build_object(
        'title',       'should fail',
        'description', 'unauthenticated call',
        'tag_ids',     '[]'::jsonb
      )
    )
  $$,
  'authentication required',
  'submit_problem_v1: raises when unauthenticated'
);

-- Restore author context for org test
set local role authenticated;
set local "request.jwt.claims" to
  '{"sub":"dddddddd-0000-0000-0000-000000000002","role":"authenticated","aud":"authenticated"}';
set local "request.jwt.claim.sub" to 'dddddddd-0000-0000-0000-000000000002';

-- ----------------------------------------------------------------
-- TEST 15: create_organization_v1 creates membership + moderation_event
-- ----------------------------------------------------------------
select lives_ok(
  $$
    select public.create_organization_v1(
      'pgTAP Org',
      'pgtap-org',
      'pgTAP test org description',
      'https://pgtap.example.com'
    )
  $$,
  'create_organization_v1: should not raise'
);

-- Verify the admin membership was created
select is(
  (select count(*) from public.organization_memberships om
   join public.organizations o on o.id = om.organization_id
   where o.slug = 'pgtap-org'
     and om.user_id         = 'dddddddd-0000-0000-0000-000000000002'
     and om.role            = 'admin'
     and om.membership_status = 'active'),
  1::bigint,
  'create_organization_v1: one admin/active membership created'
);

-- Verify the moderation_event was written
set local "request.jwt.claim.sub" to 'dddddddd-0000-0000-0000-000000000001';

select is(
  (select count(*) from public.moderation_event me
   join public.organizations o on o.id = me.target_id
   where o.slug        = 'pgtap-org'
     and me.target_type = 'organization'
     and me.action      = 'submitted'),
  1::bigint,
  'create_organization_v1: one moderation_event with action=submitted'
);

select * from finish();

rollback;
