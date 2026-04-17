-- ============================================================
-- supabase/tests/curated_import.sql
--
-- pgTAP tests for the curated-content import pipeline.
-- Covers: system profile, ensure_system_org_v1, import_curated_problem_v1.
--
-- Run via:
--   supabase db test --linked
--
-- Fallback:
--   psql "$DATABASE_URL" -f supabase/tests/curated_import.sql
--
-- The test uses the service-role call path (_service_caller_id)
-- because pgTAP runs as postgres (auth.uid() = NULL by default).
-- All writes are inside a rolled-back transaction.
-- ============================================================

begin;

select plan(46);

-- ════════════════════════════════════════════════════════════
-- §0  Fixtures
-- ════════════════════════════════════════════════════════════

-- Admin user (service caller for all RPC calls)
insert into auth.users (
  id, email, role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password
) values (
  'cccccccc-0000-0000-0000-000000000001',
  'pgtap-import-admin@dev.openclienting.local',
  'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"pgTAP Import Admin"}',
  false, 'placeholder'
) on conflict (id) do nothing;

insert into public.profiles (id, display_name, role)
values ('cccccccc-0000-0000-0000-000000000001', 'pgTAP Import Admin', 'admin')
on conflict (id) do update set role = 'admin';

-- Contributor (non-admin; used for permission-denial tests)
insert into auth.users (
  id, email, role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password
) values (
  'cccccccc-0000-0000-0000-000000000002',
  'pgtap-import-contrib@dev.openclienting.local',
  'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"pgTAP Import Contributor"}',
  false, 'placeholder'
) on conflict (id) do nothing;

insert into public.profiles (id, display_name, role)
values ('cccccccc-0000-0000-0000-000000000002', 'pgTAP Contributor', 'contributor')
on conflict (id) do update set role = 'contributor';

-- Temp tables to capture RPC results across SQL statements
create temp table _test_org     (id uuid, is_system_managed boolean, verification_status text, created_by uuid);
create temp table _test_import  (status text, problem_id uuid, packet_id text, org_id uuid, provider_org_id uuid);
create temp table _test_import2 (status text, problem_id uuid, org_id uuid, provider_org_id uuid);
create temp table _test_import3 (status text, problem_id uuid, provider_org_id uuid);

-- ════════════════════════════════════════════════════════════
-- §1  System profile existence
-- ════════════════════════════════════════════════════════════

select ok(
  exists (
    select 1 from public.profiles
    where id           = '00000000-0000-0000-0000-000000000001'
      and role         = 'admin'
      and display_name = 'OpenClienting Editorial'
  ),
  'system profile exists with role=admin and correct display_name'
);

select ok(
  exists (
    select 1 from auth.users
    where id = '00000000-0000-0000-0000-000000000001'
  ),
  'system auth user row exists'
);

-- ════════════════════════════════════════════════════════════
-- §2  Schema — provenance columns and citations table
-- ════════════════════════════════════════════════════════════

select has_column(
  'public', 'problem_templates', 'content_origin',
  'problem_templates.content_origin exists'
);

select has_column(
  'public', 'problem_templates', 'packet_id',
  'problem_templates.packet_id exists'
);

select col_is_unique(
  'public', 'problem_templates', 'packet_id',
  'problem_templates.packet_id is unique'
);

select has_table(
  'public', 'content_citations',
  'content_citations table exists'
);

select has_column(
  'public', 'content_citations', 'is_sourced_fact',
  'content_citations.is_sourced_fact exists'
);

select has_column(
  'public', 'problem_templates', 'solution_provider_organization_id',
  'problem_templates.solution_provider_organization_id exists'
);

-- ════════════════════════════════════════════════════════════
-- §3  Schema — is_system_managed on organizations
-- ════════════════════════════════════════════════════════════

select has_column(
  'public', 'organizations', 'is_system_managed',
  'organizations.is_system_managed exists'
);

-- ════════════════════════════════════════════════════════════
-- §4  ensure_system_org_v1 — creates new system-managed org
-- In this context auth.uid() = NULL → service-role path.
-- ════════════════════════════════════════════════════════════

do $$
declare v_org public.organizations;
begin
  select * into v_org
  from ensure_system_org_v1(jsonb_build_object(
    'name',               'pgTAP SME Manufacturing GmbH',
    'website',            'https://pgtap-sme-mfg.example.com',
    'description',        'Test org created by pgTAP curated import suite',
    '_service_caller_id', 'cccccccc-0000-0000-0000-000000000001'
  ));

  insert into _test_org values (v_org.id, v_org.is_system_managed, v_org.verification_status, v_org.created_by);
end $$;

select ok(
  (select is_system_managed from _test_org limit 1) = true,
  'ensure_system_org_v1 creates org with is_system_managed=true'
);

select ok(
  (select verification_status from _test_org limit 1) = 'unverified',
  'system-managed org starts as unverified'
);

select ok(
  (select created_by from _test_org limit 1) = '00000000-0000-0000-0000-000000000001',
  'system-managed org created_by is system profile'
);

select ok(
  exists (
    select 1 from public.organization_memberships
    where organization_id  = (select id from _test_org limit 1)
      and user_id           = '00000000-0000-0000-0000-000000000001'
      and role              = 'admin'
      and membership_status = 'active'
  ),
  'system profile is active admin of the new org'
);

-- §4b  Dedup by normalized website (www + trailing slash stripped)
select ok(
  (
    select ((q.org).id = (select id from _test_org limit 1))
    from (
      select ensure_system_org_v1(jsonb_build_object(
        'name',               'pgTAP SME Manufacturing GmbH',
        'website',            'https://www.pgtap-sme-mfg.example.com/',
        '_service_caller_id', 'cccccccc-0000-0000-0000-000000000001'
      )) as org
    ) q
  ),
  'ensure_system_org_v1 deduplicates by normalized website'
);

-- §4c  Dedup by case-insensitive name
select ok(
  (
    select ((q.org).id = (select id from _test_org limit 1))
    from (
      select ensure_system_org_v1(jsonb_build_object(
        'name',               'PGTAP SME MANUFACTURING GMBH',
        '_service_caller_id', 'cccccccc-0000-0000-0000-000000000001'
      )) as org
    ) q
  ),
  'ensure_system_org_v1 deduplicates by case-insensitive name'
);

-- §4d  Audit trail
select ok(
  exists (
    select 1 from public.moderation_event
    where target_type                     = 'organization'
      and target_id                       = (select id from _test_org limit 1)
      and action                          = 'submitted'
      and (metadata->>'system_managed')::boolean = true
  ),
  'ensure_system_org_v1 writes moderation_event with system_managed=true'
);

-- §4e  Non-admin service caller is denied
select throws_ok(
  format(
    $sql$select ensure_system_org_v1('{"name":"Denied Org","_service_caller_id":"%s"}'::jsonb)$sql$,
    'cccccccc-0000-0000-0000-000000000002'
  ),
  'permission denied: _service_caller_id must be a moderator or admin',
  'ensure_system_org_v1 denies non-admin service caller'
);

-- ════════════════════════════════════════════════════════════
-- §5  import_curated_problem_v1 — happy path
-- ════════════════════════════════════════════════════════════

do $$
declare v_result jsonb;
begin
  select import_curated_problem_v1(jsonb_build_object(
    'packet_id',    'pgtap-packet-001',
    'problem_owner_org', jsonb_build_object(
      'name',    'pgTAP SME Corp',
      'website', 'https://pgtap-sme-corp.example.com'
    ),
    'solution_provider_org', jsonb_build_object(
      'name',    'pgTAP Provider Platform',
      'website', 'https://pgtap-provider.example.com',
      'description', 'Test provider org created by curated import suite'
    ),
    'problem', jsonb_build_object(
      'title',           'pgTAP curated problem title',
      'description',     'pgTAP curated problem description. Long enough.',
      'source_language', 'en',
      'tag_ids',         '[]'::jsonb
    ),
    'requirements', jsonb_build_array(
      jsonb_build_object('body', 'Requirement one from pgTAP'),
      jsonb_build_object('body', 'Requirement two from pgTAP')
    ),
    'pilot_framework', jsonb_build_object(
      'scope',            'pgTAP pilot scope',
      'suggested_kpis',   'pgTAP KPIs',
      'success_criteria', 'pgTAP success criteria',
      'common_pitfalls',  'pgTAP pitfalls',
      'duration',         '3 months',
      'resource_commitment', '1 FTE'
    ),
    'citations', jsonb_build_array(
      jsonb_build_object(
        'source_url',      'https://example.com/source-1',
        'source_title',    'pgTAP Primary Source',
        'publisher',       'pgTAP Publisher',
        'source_type',     'primary',
        'access_date',     '2026-04-17',
        'evidence_note',   'Direct evidence for test',
        'is_sourced_fact', true
      ),
      jsonb_build_object(
        'source_url',      'https://example.com/source-2',
        'source_title',    'pgTAP Inference Source',
        'source_type',     'secondary',
        'access_date',     '2026-04-17',
        'is_sourced_fact', false
      )
    ),
    'curator_note',        'pgTAP test import note',
    '_service_caller_id',  'cccccccc-0000-0000-0000-000000000001'
  )) into v_result;

  insert into _test_import values (
    v_result->>'status',
    (v_result->>'problem_id')::uuid,
    v_result->>'packet_id',
    (v_result->>'org_id')::uuid,
    (v_result->>'provider_org_id')::uuid
  );
end $$;

select ok(
  (select status from _test_import limit 1) = 'imported',
  'import_curated_problem_v1 returns status=imported'
);

select ok(
  (select problem_id from _test_import limit 1) is not null,
  'import returns a non-null problem_id'
);

-- Problem row fields
select ok(
  (select content_origin from public.problem_templates
   where id = (select problem_id from _test_import limit 1)) = 'editorial_curated',
  'imported problem has content_origin=editorial_curated'
);

select ok(
  (select packet_id from public.problem_templates
   where id = (select problem_id from _test_import limit 1)) = 'pgtap-packet-001',
  'imported problem has correct packet_id'
);

select ok(
  (select status from public.problem_templates
   where id = (select problem_id from _test_import limit 1)) = 'submitted',
  'imported problem lands in status=submitted (awaits moderator review)'
);

select ok(
  (select author_id from public.problem_templates
   where id = (select problem_id from _test_import limit 1))
    = '00000000-0000-0000-0000-000000000001',
  'imported problem author_id is the system profile'
);

select ok(
  (select is_publicly_anonymous from public.problem_templates
   where id = (select problem_id from _test_import limit 1)) = true,
  'imported problem is_publicly_anonymous=true (system profile stays hidden)'
);

select ok(
  (select solution_provider_organization_id from public.problem_templates
   where id = (select problem_id from _test_import limit 1))
    = (select provider_org_id from _test_import limit 1),
  'imported problem links to the resolved solution-provider organization'
);

select ok(
  exists (
    select 1 from public.organizations
    where id = (select provider_org_id from _test_import limit 1)
      and is_system_managed = true
  ),
  'solution-provider organization is created or matched as a system-managed org'
);

-- Child rows
select ok(
  (select count(*) from public.requirements
   where problem_id = (select problem_id from _test_import limit 1)) = 2,
  'import created 2 requirements'
);

select ok(
  (select count(*) from public.pilot_frameworks
   where problem_id = (select problem_id from _test_import limit 1)) = 1,
  'import created 1 pilot_framework'
);

-- Citations
select ok(
  (select count(*) from public.content_citations
   where target_type = 'problem_template'
     and target_id   = (select problem_id from _test_import limit 1)) = 2,
  'import created 2 citations'
);

select ok(
  exists (
    select 1 from public.content_citations
    where target_id     = (select problem_id from _test_import limit 1)
      and is_sourced_fact = false
  ),
  'citations include an inference row (is_sourced_fact=false)'
);

select ok(
  (select count(*) from public.organizations
   where id in (
     select provider_org_id from (select provider_org_id from _test_import limit 1) provider_ids
     union all
     select org_id from (select org_id from _test_import limit 1) owner_ids
    )) = 2,
  'problem-owner org and provider org are both persisted as organizations'
);

-- Moderation event
select ok(
  exists (
    select 1 from public.moderation_event
    where target_type               = 'problem_template'
      and target_id                 = (select problem_id from _test_import limit 1)
      and action                    = 'submitted'
      and metadata->>'content_origin' = 'editorial_curated'
      and metadata->>'packet_id'      = 'pgtap-packet-001'
  ),
  'import writes moderation_event with editorial_curated provenance'
);

select ok(
  exists (
    select 1 from public.moderation_event
    where target_type = 'problem_template'
      and target_id = (select problem_id from _test_import limit 1)
      and reviewer_id = 'cccccccc-0000-0000-0000-000000000001'
  ),
  'import moderation_event reviewer_id matches the service caller'
);

-- ════════════════════════════════════════════════════════════
-- §6  Idempotency — re-import of same packet_id is a no-op
-- ════════════════════════════════════════════════════════════

do $$
declare v_result jsonb;
begin
  select import_curated_problem_v1(jsonb_build_object(
    'packet_id',           'pgtap-packet-001',
    'problem',             jsonb_build_object(
      'title',       'Different title should not matter',
      'description', 'Already imported packet'
    ),
    'citations',           '[]'::jsonb,
    '_service_caller_id',  'cccccccc-0000-0000-0000-000000000001'
  )) into v_result;

  insert into _test_import2 values (v_result->>'status', (v_result->>'problem_id')::uuid);
  update _test_import2
  set org_id = (v_result->>'org_id')::uuid,
      provider_org_id = (v_result->>'provider_org_id')::uuid
  where problem_id = (v_result->>'problem_id')::uuid;
end $$;

select ok(
  (select status from _test_import2 limit 1) = 'already_imported',
  'same packet_id returns already_imported (idempotent)'
);

select ok(
  (select problem_id from _test_import2 limit 1)
    = (select problem_id from _test_import limit 1),
  'idempotent re-import returns the original problem_id'
);

select ok(
  (select org_id from _test_import2 limit 1)
    = (select org_id from _test_import limit 1),
  'idempotent re-import returns the original owner org_id'
);

select ok(
  (select provider_org_id from _test_import2 limit 1)
    = (select provider_org_id from _test_import limit 1),
  'idempotent re-import returns the original provider_org_id'
);

select is(
  (select count(*) from public.content_citations
   where target_type = 'problem_template'
     and target_id = (select problem_id from _test_import limit 1)),
  2::bigint,
  'idempotent re-import does not duplicate citations'
);

select is(
  (select count(*) from public.moderation_event
   where target_type = 'problem_template'
     and target_id = (select problem_id from _test_import limit 1)
     and action = 'submitted'),
  1::bigint,
  'idempotent re-import does not duplicate moderation_event rows'
);

-- §6b  Import without a provider org leaves the provider link null
do $$
declare v_result jsonb;
begin
  select import_curated_problem_v1(jsonb_build_object(
    'packet_id',    'pgtap-packet-002',
    'problem_owner_org', jsonb_build_object(
      'name',    'pgTAP SME No Provider',
      'website', 'https://pgtap-sme-no-provider.example.com'
    ),
    'problem', jsonb_build_object(
      'title',           'pgTAP curated problem without provider',
      'description',     'No provider org should be linked for this packet.',
      'source_language', 'en',
      'tag_ids',         '[]'::jsonb
    ),
    'citations', jsonb_build_array(
      jsonb_build_object(
        'source_url',      'https://example.com/no-provider-source',
        'source_title',    'pgTAP No Provider Source',
        'publisher',       'pgTAP Publisher',
        'source_type',     'primary',
        'access_date',     '2026-04-17',
        'evidence_note',   'Direct evidence for provider-null path',
        'is_sourced_fact', true
      )
    ),
    '_service_caller_id',  'cccccccc-0000-0000-0000-000000000001'
  )) into v_result;

  insert into _test_import3 values (
    v_result->>'status',
    (v_result->>'problem_id')::uuid,
    (v_result->>'provider_org_id')::uuid
  );
end $$;

select ok(
  (select provider_org_id from _test_import3 limit 1) is null,
  'import without solution_provider_org returns provider_org_id=null'
);

select ok(
  (select solution_provider_organization_id
   from public.problem_templates
   where id = (select problem_id from _test_import3 limit 1)) is null,
  'import without solution_provider_org stores a NULL provider link'
);

delete from public.problem_templates
where id = (select problem_id from _test_import3 limit 1);

select is(
  (select count(*) from public.content_citations
   where target_type = 'problem_template'
     and target_id = (select problem_id from _test_import3 limit 1)),
  0::bigint,
  'deleting a problem_template cleans up its content_citations rows'
);

select ok(
  not exists (
    select 1 from public.problem_templates
    where id = (select problem_id from _test_import3 limit 1)
  ),
  'cleanup test removed the temporary no-provider problem row'
);

-- ════════════════════════════════════════════════════════════
-- §7  Permission denial
-- ════════════════════════════════════════════════════════════

select throws_ok(
  format($sql$
    select import_curated_problem_v1(jsonb_build_object(
      'packet_id',           'pgtap-denied-packet',
      'problem',             jsonb_build_object(
        'title',       'X',
        'description', 'Y'
      ),
      'citations',           '[]'::jsonb,
      '_service_caller_id',  '%s'
    ))
  $sql$, 'cccccccc-0000-0000-0000-000000000002'),
  'permission denied: _service_caller_id must be a moderator or admin',
  'import_curated_problem_v1 denies non-admin caller'
);

select throws_ok(
  $sql$
    select import_curated_problem_v1(jsonb_build_object(
      'packet_id', 'pgtap-invalid-tag',
      'problem', jsonb_build_object(
        'title', 'Invalid tag test',
        'description', 'Invalid tag id should fail with a descriptive message.',
        'source_language', 'en',
        'tag_ids', jsonb_build_array('11111111-1111-1111-1111-111111111111')
      ),
      'citations', jsonb_build_array(
        jsonb_build_object(
          'source_url', 'https://example.com/invalid-tag',
          'access_date', '2026-04-17'
        )
      ),
      '_service_caller_id', 'cccccccc-0000-0000-0000-000000000001'
    ))
  $sql$,
  'invalid problem.tag_ids entry: 11111111-1111-1111-1111-111111111111 (not found in public.tags)',
  'import_curated_problem_v1 rejects unknown tag IDs with a descriptive error'
);

select throws_ok(
  $sql$
    select import_curated_problem_v1(jsonb_build_object(
      'packet_id', 'pgtap-invalid-access-date',
      'problem', jsonb_build_object(
        'title', 'Invalid date test',
        'description', 'Malformed citation dates should fail with context.',
        'source_language', 'en',
        'tag_ids', '[]'::jsonb
      ),
      'citations', jsonb_build_array(
        jsonb_build_object(
          'source_url', 'https://example.com/invalid-date',
          'access_date', 'April 17, 2026'
        )
      ),
      '_service_caller_id', 'cccccccc-0000-0000-0000-000000000001'
    ))
  $sql$,
  'invalid citations access_date "April 17, 2026" for source_url https://example.com/invalid-date',
  'import_curated_problem_v1 rejects malformed citation access_date values with source context'
);

-- ════════════════════════════════════════════════════════════

select * from finish();

rollback;
