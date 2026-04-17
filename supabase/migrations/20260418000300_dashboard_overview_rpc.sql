-- ============================================================
-- OpenClienting.org — Dashboard Overview RPC
--
-- Consolidates 15 PostgREST queries into a single call.
-- SECURITY INVOKER so all existing RLS policies apply naturally.
-- ============================================================

create or replace function public.get_dashboard_overview(p_user uuid)
returns jsonb
language sql
stable
security invoker
as $$
with
  -- 1. Unread notification count
  unread_count as (
    select count(*)::int as cnt
    from public.notifications
    where user_id = p_user
      and read = false
  ),

  -- 2. 3 most-recent notifications (unread first, then newest)
  recent_notifs as (
    select
      id,
      title,
      body,
      link,
      read,
      created_at
    from public.notifications
    where user_id = p_user
    order by read asc, created_at desc
    limit 3
  ),

  -- 3-8. Pending review counts (submitted | in_review) per content type
  prob_pending as (
    select id, title as display_title, status, created_at
    from public.problem_templates
    where author_id = p_user
      and status in ('submitted', 'in_review')
    order by created_at desc
    limit 3
  ),
  req_pending as (
    select id,
      case
        when length(body) > 60 then substring(body, 1, 60) || '…'
        else body
      end as display_title,
      status, created_at
    from public.requirements
    where author_id = p_user
      and status in ('submitted', 'in_review')
    order by created_at desc
    limit 3
  ),
  fwk_pending as (
    select id,
      case
        when scope is null or scope = '' then 'Pilot Framework'
        when length(scope) > 60 then substring(scope, 1, 60) || '…'
        else scope
      end as display_title,
      status, created_at
    from public.pilot_frameworks
    where author_id = p_user
      and status in ('submitted', 'in_review')
    order by created_at desc
    limit 3
  ),
  sol_pending as (
    select id, title as display_title, status, created_at
    from public.solution_approaches
    where author_id = p_user
      and status in ('submitted', 'in_review')
    order by created_at desc
    limit 3
  ),
  sr_pending as (
    select id,
      case
        when length(report_summary) > 60 then substring(report_summary, 1, 60) || '…'
        else report_summary
      end as display_title,
      status, created_at
    from public.success_reports
    where submitted_by_user_id = p_user
      and status in ('submitted', 'in_review')
    order by created_at desc
    limit 3
  ),
  ka_pending as (
    select id, title as display_title, status, created_at
    from public.knowledge_articles
    where author_id = p_user
      and status in ('submitted', 'in_review')
    order by created_at desc
    limit 3
  ),

  -- Aggregate pending across all content types (count + top-3 by created_at)
  pending_all as (
    select 'problem'::text as kind, id, display_title, status, created_at from prob_pending
    union all
    select 'requirement', id, display_title, status, created_at from req_pending
    union all
    select 'framework', id, display_title, status, created_at from fwk_pending
    union all
    select 'solution', id, display_title, status, created_at from sol_pending
    union all
    select 'success_report', id, display_title, status, created_at from sr_pending
    union all
    select 'knowledge_article', id, display_title, status, created_at from ka_pending
  ),
  pending_count as (
    select
      (select count(*)::int from public.problem_templates    where author_id = p_user and status in ('submitted','in_review'))
    + (select count(*)::int from public.requirements         where author_id = p_user and status in ('submitted','in_review'))
    + (select count(*)::int from public.pilot_frameworks     where author_id = p_user and status in ('submitted','in_review'))
    + (select count(*)::int from public.solution_approaches  where author_id = p_user and status in ('submitted','in_review'))
    + (select count(*)::int from public.success_reports      where submitted_by_user_id = p_user and status in ('submitted','in_review'))
    + (select count(*)::int from public.knowledge_articles   where author_id = p_user and status in ('submitted','in_review'))
    as cnt
  ),

  -- 9-10. Drafts (only problem_templates + solution_approaches support draft)
  prob_draft as (
    select id, title as display_title, updated_at
    from public.problem_templates
    where author_id = p_user
      and status = 'draft'
    order by updated_at desc
    limit 3
  ),
  sol_draft as (
    select id, title as display_title, updated_at
    from public.solution_approaches
    where author_id = p_user
      and status = 'draft'
    order by updated_at desc
    limit 3
  ),
  drafts_all as (
    select 'problem'::text as kind, id, display_title, updated_at from prob_draft
    union all
    select 'solution', id, display_title, updated_at from sol_draft
  ),
  drafts_count as (
    select
      (select count(*)::int from public.problem_templates   where author_id = p_user and status = 'draft')
    + (select count(*)::int from public.solution_approaches where author_id = p_user and status = 'draft')
    as cnt
  ),

  -- 11. Organization memberships (active | pending), with org details
  orgs as (
    select
      om.role,
      om.membership_status,
      o.id       as org_id,
      o.name     as org_name,
      o.slug     as org_slug,
      o.verification_status,
      o.logo_url
    from public.organization_memberships om
    join public.organizations o on o.id = om.organization_id
    where om.user_id = p_user
      and om.membership_status in ('active', 'pending')
    order by om.updated_at desc
    limit 3
  ),

  -- 12-15. Recent published submissions (top-5 combined, newest first)
  prob_published as (
    select id, title as display_title, status, created_at
    from public.problem_templates
    where author_id = p_user
      and status = 'published'
    order by created_at desc
    limit 5
  ),
  sol_published as (
    select id, title as display_title, status, created_at
    from public.solution_approaches
    where author_id = p_user
      and status = 'published'
    order by created_at desc
    limit 5
  ),
  sr_published as (
    select id,
      case
        when length(report_summary) > 60 then substring(report_summary, 1, 60) || '…'
        else report_summary
      end as display_title,
      status, created_at
    from public.success_reports
    where submitted_by_user_id = p_user
      and status = 'published'
    order by created_at desc
    limit 5
  ),
  ka_published as (
    select id, title as display_title, status, created_at
    from public.knowledge_articles
    where author_id = p_user
      and status = 'published'
    order by created_at desc
    limit 5
  ),
  submissions_all as (
    select 'problem'::text as kind, id, display_title, status, created_at from prob_published
    union all
    select 'solution', id, display_title, status, created_at from sol_published
    union all
    select 'success_report', id, display_title, status, created_at from sr_published
    union all
    select 'knowledge_article', id, display_title, status, created_at from ka_published
  )

-- Final assembly
select jsonb_build_object(
  'unreadNotifications', (select cnt from unread_count),

  'recentNotifications', coalesce(
    (select jsonb_agg(
       jsonb_build_object(
         'id',        id,
         'title',     title,
         'body',      body,
         'link',      link,
         'read',      read,
         'createdAt', created_at
       ) order by read asc, created_at desc
     )
     from recent_notifs),
    '[]'::jsonb
  ),

  'pendingReview', jsonb_build_object(
    'count', (select cnt from pending_count),
    'recent', coalesce(
      (select jsonb_agg(
         jsonb_build_object(
           'kind',      kind,
           'id',        id,
           'title',     display_title,
           'status',    status,
           'createdAt', created_at
         ) order by created_at desc
       )
       from (
         select * from pending_all
         order by created_at desc
         limit 3
       ) top_pending),
      '[]'::jsonb
    )
  ),

  'drafts', jsonb_build_object(
    'count', (select cnt from drafts_count),
    'recent', coalesce(
      (select jsonb_agg(
         jsonb_build_object(
           'kind',      kind,
           'id',        id,
           'title',     display_title,
           'updatedAt', updated_at
         ) order by updated_at desc
       )
       from (
         select * from drafts_all
         order by updated_at desc
         limit 3
       ) top_drafts),
      '[]'::jsonb
    )
  ),

  'organizations', coalesce(
    (select jsonb_agg(
       jsonb_build_object(
         'id',                 org_id,
         'name',               org_name,
         'slug',               org_slug,
         'role',               role,
         'membershipStatus',   membership_status,
         'verificationStatus', verification_status,
         'logoUrl',            logo_url
       )
     )
     from orgs),
    '[]'::jsonb
  ),

  'recentSubmissions', coalesce(
    (select jsonb_agg(
       jsonb_build_object(
         'kind',      kind,
         'id',        id,
         'title',     display_title,
         'status',    status,
         'createdAt', created_at
       ) order by created_at desc
     )
     from (
       select * from submissions_all
       order by created_at desc
       limit 5
     ) top_submissions),
    '[]'::jsonb
  )
);
$$;

grant execute on function public.get_dashboard_overview(uuid) to authenticated;
