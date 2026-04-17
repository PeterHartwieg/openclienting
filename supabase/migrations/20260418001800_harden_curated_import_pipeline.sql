-- ============================================================
-- 20260418001800_harden_curated_import_pipeline.sql
--
-- Polishes the reusable curated import pipeline:
-- - service-role moderation_event writes no longer rely on auth.uid()
-- - import_curated_problem_v1 returns both org ids on already_imported
-- - tag IDs are prevalidated with a clear error message
-- - malformed citation access_date values fail with source-specific context
-- ============================================================

drop policy if exists "moderation_event_mod_insert" on public.moderation_event;

create policy "moderation_event_mod_insert"
  on public.moderation_event
  for insert
  with check (
    (
      auth.uid() is not null
      and public.is_moderator_or_admin()
      and reviewer_id = auth.uid()
    )
    or (
      auth.uid() is null
      and exists (
        select 1
        from public.profiles
        where id = reviewer_id
          and role in ('moderator', 'admin')
      )
    )
  );

create or replace function public.import_curated_problem_v1(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  system_profile_id constant uuid := '00000000-0000-0000-0000-000000000001';

  v_caller_uid   uuid;
  v_packet_id    text;
  v_problem_id   uuid;
  v_existing_id  uuid;
  v_existing_org_id uuid;
  v_existing_provider_org_id uuid;
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
  v_access_date  date;
begin
  v_caller_uid := auth.uid();

  if v_caller_uid is null then
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

  select
    id,
    author_organization_id,
    solution_provider_organization_id
  into
    v_existing_id,
    v_existing_org_id,
    v_existing_provider_org_id
  from public.problem_templates
  where packet_id = v_packet_id
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object(
      'status',          'already_imported',
      'problem_id',      v_existing_id,
      'packet_id',       v_packet_id,
      'org_id',          v_existing_org_id,
      'provider_org_id', v_existing_provider_org_id
    );
  end if;

  if p_payload->'problem_owner_org' is not null
     and nullif(trim(p_payload->'problem_owner_org'->>'name'), '') is not null
  then
    select * into v_org
    from ensure_system_org_v1(
      p_payload->'problem_owner_org'
      || jsonb_build_object('_service_caller_id', v_caller_uid)
    );
    v_org_id := v_org.id;
  end if;

  if p_payload->'solution_provider_org' is not null
     and nullif(trim(p_payload->'solution_provider_org'->>'name'), '') is not null
  then
    select * into v_provider_org
    from ensure_system_org_v1(
      p_payload->'solution_provider_org'
      || jsonb_build_object('_service_caller_id', v_caller_uid)
    );
    v_provider_org_id := v_provider_org.id;
  end if;

  for v_tag_id in
    select (elem#>>'{}')::uuid
    from jsonb_array_elements(
      coalesce(p_payload->'problem'->'tag_ids', '[]'::jsonb)
    ) as elem
  loop
    if not exists (
      select 1 from public.tags
      where id = v_tag_id
    ) then
      raise exception 'invalid problem.tag_ids entry: % (not found in public.tags)', v_tag_id;
    end if;
  end loop;

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

  for v_citation in
    select elem
    from jsonb_array_elements(
      coalesce(p_payload->'citations', '[]'::jsonb)
    ) as elem
  loop
    continue when nullif(trim(v_citation->>'source_url'), '') is null;

    begin
      v_access_date := nullif(trim(v_citation->>'access_date'), '')::date;
    exception
      when others then
        raise exception
          'invalid citations access_date "%" for source_url %',
          coalesce(v_citation->>'access_date', ''),
          trim(v_citation->>'source_url');
    end;

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
      v_access_date,
      nullif(trim(v_citation->>'evidence_note'), ''),
      coalesce((v_citation->>'is_sourced_fact')::boolean, true),
      system_profile_id
    );
  end loop;

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

  return jsonb_build_object(
    'status',          'imported',
    'problem_id',      v_problem_id,
    'packet_id',       v_packet_id,
    'org_id',          v_org_id,
    'provider_org_id', v_provider_org_id
  );
end;
$$;

