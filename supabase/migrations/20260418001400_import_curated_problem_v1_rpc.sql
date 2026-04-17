-- ============================================================
-- 20260418001400_import_curated_problem_v1_rpc.sql
--
-- Admin-only RPC for importing an editorially curated problem
-- packet produced by the content team.
--
-- Key behaviors:
--   Idempotency   — packets with the same packet_id are skipped;
--                   returns existing problem_id with status='already_imported'.
--   Authorship    — author_id is always the system profile, not the
--                   calling admin. is_publicly_anonymous=true so the
--                   system profile is never shown as "author" in the UI.
--   Organization  — org is resolved/created via ensure_system_org_v1;
--                   is_org_anonymous=false so the real org is shown.
--   Status        — problems land in 'submitted' for a moderator to
--                   review and publish via the existing moderate_item_v1
--                   RPC. This preserves the editorial review step.
--   Citations     — stored in content_citations linked to the problem_id.
--   Provenance    — content_origin='editorial_curated' + packet_id stored
--                   on problem_templates for filtering and audit.
--
-- Payload shape (mirrors packet-schema.yaml; see platform-ingestion-spec.md):
--   {
--     "packet_id":          "stable-string",          -- required; for idempotency
--     "problem_owner_org":  {                          -- optional
--       "organization_id":  "uuid | null",
--       "name":             "...",
--       "website":          "...",
--       "description":      "...",
--       "country":          "..."
--     },
--     "solution_provider_org": {                      -- optional
--       "organization_id":  "uuid | null",
--       "name":             "...",
--       "website":          "...",
--       "description":      "...",
--       "country":          "..."
--     },
--     "problem": {
--       "title":            "...",                     -- required
--       "description":      "...",                     -- required
--       "source_language":  "en",
--       "tag_ids":          ["uuid", ...]
--     },
--     "requirements": [
--       { "body": "..." }
--     ],
--     "pilot_framework": {                             -- optional
--       "scope":               "...",
--       "suggested_kpis":      "...",
--       "success_criteria":    "...",
--       "common_pitfalls":     "...",
--       "duration":            "...",
--       "resource_commitment": "..."
--     },
--     "citations": [
--       {
--         "source_url":     "...",                     -- required
--         "source_title":   "...",
--         "publisher":      "...",
--         "source_type":    "primary|secondary",
--         "access_date":    "YYYY-MM-DD",
--         "evidence_note":  "...",
--         "is_sourced_fact": true
--       }
--     ],
--     "curator_note":       "...",
--     "_service_caller_id": "uuid"  -- only for service-role context
--   }
--
-- Returns jsonb:
--   { "status": "imported"|"already_imported",
--     "problem_id": "uuid", "packet_id": "...", "org_id": "uuid|null" }
--
-- Auth:
--   Regular callers: must be admin or moderator (auth.uid() set).
--   Service-role callers (auth.uid() IS NULL): must supply
--     _service_caller_id — a profile UUID with role admin/moderator.
--
-- SECURITY DEFINER: required because:
--   - moderation_event has no insert RLS policy
--   - problem_templates/requirements/pilot_frameworks insert RLS
--     ties author_id to auth.uid(); we must write system profile UUID
--   - content_citations has no insert RLS policy (write-via-RPC only)
-- ============================================================

create or replace function public.import_curated_problem_v1(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Well-known system profile UUID (matches 20260418001000)
  system_profile_id constant uuid := '00000000-0000-0000-0000-000000000001';

  v_caller_uid   uuid;
  v_packet_id    text;
  v_problem_id   uuid;
  v_existing_id  uuid;
  v_org          public.organizations;
  v_org_id       uuid;
  v_provider_org public.organizations;
  v_provider_org_id uuid;
  v_title        text;
  v_description  text;
  v_source_lang  text;
  v_tag_id       uuid;
  v_req          jsonb;
  v_pf           jsonb;
  v_citation     jsonb;
begin
  -- ── Auth guard ──────────────────────────────────────────────
  v_caller_uid := auth.uid();

  if v_caller_uid is null then
    -- Service-role context: explicit caller required for audit trail
    v_caller_uid := nullif(trim(p_payload->>'_service_caller_id'), '')::uuid;
    if v_caller_uid is null then
      raise exception 'authentication required; '
        'supply _service_caller_id in payload when using service role';
    end if;
    if not exists (
      select 1 from public.profiles
      where id = v_caller_uid
        and role in ('moderator', 'admin')
    ) then
      raise exception 'permission denied: _service_caller_id must be a moderator or admin';
    end if;
  else
    if not is_moderator_or_admin() then
      raise exception 'permission denied: admin or moderator required';
    end if;
  end if;

  -- ── Validate required fields ────────────────────────────────
  v_packet_id   := nullif(trim(p_payload->>'packet_id'), '');
  v_title       := nullif(trim(p_payload->'problem'->>'title'), '');
  v_description := nullif(trim(p_payload->'problem'->>'description'), '');
  v_source_lang := coalesce(
    nullif(trim(p_payload->'problem'->>'source_language'), ''),
    'en'
  );

  if v_packet_id is null then
    raise exception 'packet_id is required for idempotent import';
  end if;
  if v_title is null then
    raise exception 'problem.title is required';
  end if;
  if v_description is null then
    raise exception 'problem.description is required';
  end if;

  -- ── Idempotency check ───────────────────────────────────────
  select id into v_existing_id
  from public.problem_templates
  where packet_id = v_packet_id
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object(
      'status',          'already_imported',
      'problem_id',      v_existing_id,
      'packet_id',       v_packet_id,
      'provider_org_id', (
        select solution_provider_organization_id
        from public.problem_templates
        where id = v_existing_id
      )
    );
  end if;

  -- ── Resolve or create problem-owner organization ────────────
  if p_payload->'problem_owner_org' is not null
     and nullif(trim(p_payload->'problem_owner_org'->>'name'), '') is not null
  then
    -- Pass _service_caller_id through so ensure_system_org_v1 can
    -- build its own audit entry in service-role context
    select ensure_system_org_v1(
      p_payload->'problem_owner_org'
      || jsonb_build_object('_service_caller_id', v_caller_uid)
    ) into v_org;
    v_org_id := v_org.id;
  end if;

  -- ── Resolve or create solution-provider organization ──────────
  if p_payload->'solution_provider_org' is not null
     and nullif(trim(p_payload->'solution_provider_org'->>'name'), '') is not null
  then
    select ensure_system_org_v1(
      p_payload->'solution_provider_org'
      || jsonb_build_object('_service_caller_id', v_caller_uid)
    ) into v_provider_org;
    v_provider_org_id := v_provider_org.id;
  end if;

  -- ── Insert problem_templates ────────────────────────────────
  -- is_publicly_anonymous=true: system profile is not shown as "author"
  -- is_org_anonymous=false:     the real organisation is always shown
  -- content_origin='editorial_curated': distinguishes from user content
  insert into public.problem_templates (
    title, description,
    author_id, author_organization_id, solution_provider_organization_id,
    is_publicly_anonymous, is_org_anonymous,
    source_language, status,
    content_origin, packet_id
  ) values (
    v_title, v_description,
    system_profile_id, v_org_id, v_provider_org_id,
    true,  false,
    v_source_lang, 'submitted',
    'editorial_curated', v_packet_id
  )
  returning id into v_problem_id;

  -- ── Insert tags ─────────────────────────────────────────────
  for v_tag_id in
    select (elem#>>'{}')::uuid
    from jsonb_array_elements(
      coalesce(p_payload->'problem'->'tag_ids', '[]'::jsonb)
    ) as elem
  loop
    insert into public.problem_tags (problem_id, tag_id)
    values (v_problem_id, v_tag_id)
    on conflict do nothing;
  end loop;

  -- ── Insert requirements ─────────────────────────────────────
  for v_req in
    select elem
    from jsonb_array_elements(
      coalesce(p_payload->'requirements', '[]'::jsonb)
    ) as elem
  loop
    insert into public.requirements (
      problem_id, body,
      author_id, author_organization_id,
      is_publicly_anonymous, is_org_anonymous,
      source_language, status
    ) values (
      v_problem_id,
      nullif(trim(v_req->>'body'), ''),
      system_profile_id, v_org_id,
      true, false,
      v_source_lang, 'submitted'
    );
  end loop;

  -- ── Insert pilot_framework ──────────────────────────────────
  -- Packet schema uses one pilot_framework object (not an array).
  -- The import script flattens nested { text, source_basis, note }
  -- fields to plain strings before calling this RPC.
  v_pf := p_payload->'pilot_framework';
  if v_pf is not null and v_pf <> 'null'::jsonb then
    insert into public.pilot_frameworks (
      problem_id,
      scope, suggested_kpis, success_criteria,
      common_pitfalls, duration, resource_commitment,
      author_id, author_organization_id,
      is_publicly_anonymous, is_org_anonymous,
      source_language, status
    ) values (
      v_problem_id,
      nullif(trim(v_pf->>'scope'), ''),
      nullif(trim(v_pf->>'suggested_kpis'), ''),
      nullif(trim(v_pf->>'success_criteria'), ''),
      nullif(trim(v_pf->>'common_pitfalls'), ''),
      nullif(trim(v_pf->>'duration'), ''),
      nullif(trim(v_pf->>'resource_commitment'), ''),
      system_profile_id, v_org_id,
      true, false,
      v_source_lang, 'submitted'
    );
  end if;

  -- ── Insert citations ────────────────────────────────────────
  for v_citation in
    select elem
    from jsonb_array_elements(
      coalesce(p_payload->'citations', '[]'::jsonb)
    ) as elem
  loop
    -- source_url is required per packet schema; skip malformed rows
    continue when nullif(trim(v_citation->>'source_url'), '') is null;

    insert into public.content_citations (
      target_type, target_id,
      source_url, source_title, publisher,
      source_type, access_date, evidence_note,
      is_sourced_fact, created_by
    ) values (
      'problem_template', v_problem_id,
      trim(v_citation->>'source_url'),
      nullif(trim(v_citation->>'source_title'), ''),
      nullif(trim(v_citation->>'publisher'), ''),
      nullif(trim(v_citation->>'source_type'), ''),
      nullif(trim(v_citation->>'access_date'), '')::date,
      nullif(trim(v_citation->>'evidence_note'), ''),
      coalesce((v_citation->>'is_sourced_fact')::boolean, true),
      system_profile_id
    );
  end loop;

  -- ── Audit trail ─────────────────────────────────────────────
  insert into public.moderation_event (
    target_type, target_id, reviewer_id,
    action, before_status, after_status, metadata
  ) values (
    'problem_template', v_problem_id, v_caller_uid,
    'submitted', null, 'submitted',
    jsonb_build_object(
      'content_origin', 'editorial_curated',
      'packet_id',      v_packet_id,
      'curator_note',   p_payload->>'curator_note',
      'imported_by',    v_caller_uid
    )
  );

  -- ── Return result ────────────────────────────────────────────
  return jsonb_build_object(
    'status',          'imported',
    'problem_id',      v_problem_id,
    'packet_id',       v_packet_id,
    'org_id',          v_org_id,
    'provider_org_id', v_provider_org_id
  );
end;
$$;

grant execute on function public.import_curated_problem_v1(jsonb) to authenticated;
