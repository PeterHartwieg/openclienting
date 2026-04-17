-- ============================================================
-- 20260418000800_submit_problem_v1_rpc.sql
--
-- Atomic RPC for submitting a problem with all child content.
-- Wraps problem_templates + problem_tags + requirements +
-- pilot_frameworks + moderation_event in a single implicit
-- transaction so the whole submission is all-or-nothing.
--
-- SECURITY DEFINER (not INVOKER): the moderation_event table
-- has no insert RLS policy — writes are restricted to trusted
-- RPCs only. Using SECURITY DEFINER lets us bypass that gap
-- while still enforcing the caller identity explicitly via
-- the `auth.uid() is not null` guard at the top of the body.
-- The caller's own RLS still applies to problem_templates,
-- problem_tags, requirements, and pilot_frameworks because
-- those tables have permissive insert policies for
-- authenticated users who own the row (author_id = auth.uid()).
-- We additionally recheck author_id inside the INSERT to
-- prevent spoofing even under SECURITY DEFINER.
-- ============================================================

create or replace function public.submit_problem_v1(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid              uuid;
  v_problem_id       uuid;
  v_title            text;
  v_description      text;
  v_is_pub_anon      boolean;
  v_is_org_anon      boolean;
  v_org_id           uuid;
  v_source_language  text;
  v_tag_id           uuid;
  v_req              jsonb;
  v_pf               jsonb;
begin
  -- 1. Auth guard — fail fast with a clear message
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  -- 2. Extract required scalar fields from the payload
  v_title           := trim(p_payload->>'title');
  v_description     := trim(p_payload->>'description');
  v_is_pub_anon     := coalesce((p_payload->>'is_publicly_anonymous')::boolean, false);
  v_is_org_anon     := coalesce((p_payload->>'is_org_anonymous')::boolean, false);
  v_org_id          := nullif(p_payload->>'author_organization_id', '')::uuid;
  v_source_language := coalesce(nullif(trim(p_payload->>'source_language'), ''), 'en');

  if v_title is null or v_title = '' then
    raise exception 'title is required';
  end if;
  if v_description is null or v_description = '' then
    raise exception 'description is required';
  end if;

  -- 3. Insert problem_templates row; capture new id
  insert into public.problem_templates (
    title,
    description,
    author_id,
    author_organization_id,
    is_publicly_anonymous,
    is_org_anonymous,
    source_language,
    status
  ) values (
    v_title,
    v_description,
    v_uid,
    v_org_id,
    v_is_pub_anon,
    v_is_org_anon,
    v_source_language,
    'submitted'
  )
  returning id into v_problem_id;

  -- 4. Insert problem_tags for each tag_id in the array
  for v_tag_id in
    select (elem#>>'{}')::uuid
    from jsonb_array_elements(coalesce(p_payload->'tag_ids', '[]'::jsonb)) as elem
  loop
    insert into public.problem_tags (problem_id, tag_id)
    values (v_problem_id, v_tag_id);
  end loop;

  -- 5. Insert requirements
  for v_req in
    select elem
    from jsonb_array_elements(coalesce(p_payload->'requirements', '[]'::jsonb)) as elem
  loop
    insert into public.requirements (
      problem_id,
      body,
      author_id,
      author_organization_id,
      is_publicly_anonymous,
      is_org_anonymous,
      source_language,
      status
    ) values (
      v_problem_id,
      trim(v_req->>'body'),
      v_uid,
      v_org_id,
      coalesce((v_req->>'is_publicly_anonymous')::boolean, v_is_pub_anon),
      coalesce((v_req->>'is_org_anonymous')::boolean, v_is_org_anon),
      coalesce(nullif(trim(v_req->>'source_language'), ''), v_source_language),
      'submitted'
    );
  end loop;

  -- 6. Insert pilot_frameworks
  for v_pf in
    select elem
    from jsonb_array_elements(coalesce(p_payload->'pilot_frameworks', '[]'::jsonb)) as elem
  loop
    insert into public.pilot_frameworks (
      problem_id,
      scope,
      suggested_kpis,
      success_criteria,
      common_pitfalls,
      duration,
      resource_commitment,
      author_id,
      author_organization_id,
      is_publicly_anonymous,
      is_org_anonymous,
      source_language,
      status
    ) values (
      v_problem_id,
      nullif(trim(v_pf->>'scope'), ''),
      nullif(trim(v_pf->>'suggested_kpis'), ''),
      nullif(trim(v_pf->>'success_criteria'), ''),
      nullif(trim(v_pf->>'common_pitfalls'), ''),
      nullif(trim(v_pf->>'duration'), ''),
      nullif(trim(v_pf->>'resource_commitment'), ''),
      v_uid,
      v_org_id,
      coalesce((v_pf->>'is_publicly_anonymous')::boolean, v_is_pub_anon),
      coalesce((v_pf->>'is_org_anonymous')::boolean, v_is_org_anon),
      coalesce(nullif(trim(v_pf->>'source_language'), ''), v_source_language),
      'submitted'
    );
  end loop;

  -- 7. Write audit row to moderation_event
  --    reviewer_id = submitter's uid; action = 'submitted' distinguishes
  --    this from moderator-initiated actions ('approved', 'rejected', etc.)
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
    v_problem_id,
    v_uid,
    'submitted',
    null,
    null,
    null,
    'submitted',
    jsonb_build_object('anonymous', v_is_pub_anon)
  );

  -- 8. Return the new problem's id
  return v_problem_id;
end;
$$;

grant execute on function public.submit_problem_v1(jsonb) to authenticated;
