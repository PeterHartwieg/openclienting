-- ============================================================
-- 20260418000600_moderate_item_v1_rpc.sql
--
-- Atomic RPC for moderating any supported content type.
-- Wraps status update + moderation_event insert + optional
-- cascade in one implicit transaction.
--
-- SECURITY INVOKER so RLS on target tables applies naturally.
-- Permission is enforced explicitly via is_moderator_or_admin().
-- ============================================================

create or replace function public.moderate_item_v1(
  p_target_type text,
  p_target_id   uuid,
  p_decision    text,   -- 'approved' | 'rejected'
  p_reason      text default null
) returns public.moderation_event
language plpgsql
security invoker
as $$
declare
  v_before_status text;
  v_after_status  text;
  v_event         public.moderation_event;
begin
  -- 1. Validate decision
  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid decision: %. Must be ''approved'' or ''rejected''.', p_decision;
  end if;

  -- 2. Validate target_type
  if p_target_type not in (
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
  ) then
    raise exception 'invalid target_type: %', p_target_type;
  end if;

  -- 3. Permission check
  if not public.is_moderator_or_admin() then
    raise exception 'permission denied: moderator or admin role required';
  end if;

  -- 4. Capture before_status from the appropriate table
  case p_target_type
    when 'problem_template' then
      select status into v_before_status
      from public.problem_templates where id = p_target_id;
    when 'requirement' then
      select status into v_before_status
      from public.requirements where id = p_target_id;
    when 'pilot_framework' then
      select status into v_before_status
      from public.pilot_frameworks where id = p_target_id;
    when 'solution_approach' then
      select status into v_before_status
      from public.solution_approaches where id = p_target_id;
    when 'success_report' then
      select status into v_before_status
      from public.success_reports where id = p_target_id;
    when 'knowledge_article' then
      select status into v_before_status
      from public.knowledge_articles where id = p_target_id;
    when 'suggested_edit' then
      select status into v_before_status
      from public.suggested_edits where id = p_target_id;
    else
      v_before_status := null;
  end case;

  -- 5. Compute new status
  v_after_status := case p_decision
    when 'approved' then 'published'
    else 'rejected'
  end;

  -- 6. Apply status update to target table
  case p_target_type
    when 'problem_template' then
      update public.problem_templates
        set status = v_after_status
      where id = p_target_id;
      if not found then
        raise exception 'problem_template not found: %', p_target_id;
      end if;
    when 'requirement' then
      update public.requirements
        set status = v_after_status
      where id = p_target_id;
      if not found then
        raise exception 'requirement not found: %', p_target_id;
      end if;
    when 'pilot_framework' then
      update public.pilot_frameworks
        set status = v_after_status
      where id = p_target_id;
      if not found then
        raise exception 'pilot_framework not found: %', p_target_id;
      end if;
    when 'solution_approach' then
      update public.solution_approaches
        set status = v_after_status
      where id = p_target_id;
      if not found then
        raise exception 'solution_approach not found: %', p_target_id;
      end if;
    when 'success_report' then
      update public.success_reports
        set status = v_after_status
      where id = p_target_id;
      if not found then
        raise exception 'success_report not found: %', p_target_id;
      end if;
    when 'knowledge_article' then
      update public.knowledge_articles
        set status = v_after_status
      where id = p_target_id;
      if not found then
        raise exception 'knowledge_article not found: %', p_target_id;
      end if;
    when 'suggested_edit' then
      update public.suggested_edits
        set status = v_after_status
      where id = p_target_id;
      if not found then
        raise exception 'suggested_edit not found: %', p_target_id;
      end if;
    else
      -- organization / membership / organization_membership: no status column
      -- handled by the dedicated review_organization_verification RPC
      null;
  end case;

  -- 7. Insert moderation_event row
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
    p_target_type,
    p_target_id,
    auth.uid(),
    p_decision,
    p_decision,
    nullif(trim(coalesce(p_reason, '')), ''),
    v_before_status,
    v_after_status,
    '{}'::jsonb
  )
  returning * into v_event;

  -- 8. Cascade: approve initial child content when a problem_template is approved
  if p_target_type = 'problem_template' and p_decision = 'approved' then
    perform public.cascade_approve_initial_content(p_target_id);
  end if;

  return v_event;
end;
$$;

grant execute on function public.moderate_item_v1(text, uuid, text, text) to authenticated;
