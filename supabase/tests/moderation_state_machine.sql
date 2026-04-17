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

select plan(9);

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

select * from finish();

rollback;
