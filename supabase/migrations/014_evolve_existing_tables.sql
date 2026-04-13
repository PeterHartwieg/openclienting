-- ============================================================
-- OpenClienting.org — Evolve Existing Tables for Trust Model
-- ============================================================

-- ============================================================
-- 1. DUAL ANONYMITY: replace `anonymous` with two columns
-- ============================================================

-- Problem templates
alter table public.problem_templates
  add column is_publicly_anonymous boolean not null default false,
  add column is_org_anonymous boolean not null default false,
  add column author_organization_id uuid references public.organizations(id);

-- Backfill from existing anonymous column
update public.problem_templates set is_publicly_anonymous = anonymous;

alter table public.problem_templates drop column anonymous;

create index idx_problem_templates_org on public.problem_templates(author_organization_id);

-- Requirements
alter table public.requirements
  add column is_publicly_anonymous boolean not null default false,
  add column is_org_anonymous boolean not null default false,
  add column author_organization_id uuid references public.organizations(id);

update public.requirements set is_publicly_anonymous = anonymous;
alter table public.requirements drop column anonymous;

-- Pilot frameworks
alter table public.pilot_frameworks
  add column is_publicly_anonymous boolean not null default false,
  add column is_org_anonymous boolean not null default false,
  add column author_organization_id uuid references public.organizations(id);

update public.pilot_frameworks set is_publicly_anonymous = anonymous;
alter table public.pilot_frameworks drop column anonymous;

-- Solution approaches
alter table public.solution_approaches
  add column is_publicly_anonymous boolean not null default false,
  add column is_org_anonymous boolean not null default false,
  add column author_organization_id uuid references public.organizations(id);

update public.solution_approaches set is_publicly_anonymous = anonymous;
alter table public.solution_approaches drop column anonymous;

-- Comments
alter table public.comments
  add column is_publicly_anonymous boolean not null default false,
  add column is_org_anonymous boolean not null default false,
  add column author_organization_id uuid references public.organizations(id);

-- Comments had `anonymous` too
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'comments' and column_name = 'anonymous'
  ) then
    execute 'update public.comments set is_publicly_anonymous = anonymous';
    execute 'alter table public.comments drop column anonymous';
  end if;
end $$;

-- ============================================================
-- 2. EVOLVE SUCCESS REPORTS for high-trust model
-- ============================================================

-- Rename author_id → submitted_by_user_id for clarity
alter table public.success_reports rename column author_id to submitted_by_user_id;

-- Update RLS policies to use new column name
drop policy if exists "success_reports_select" on public.success_reports;
create policy "success_reports_select" on public.success_reports for select
  using (
    (status = 'published' and exists (
      select 1 from public.solution_approaches sa
      join public.problem_templates pt on pt.id = sa.problem_id
      where sa.id = solution_approach_id
        and sa.status = 'published'
        and pt.status = 'published'
    ))
    or submitted_by_user_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

drop policy if exists "success_reports_insert" on public.success_reports;
create policy "success_reports_insert" on public.success_reports for insert
  with check (auth.uid() is not null and submitted_by_user_id = auth.uid());

drop policy if exists "success_reports_update" on public.success_reports;
create policy "success_reports_update" on public.success_reports for update
  using (submitted_by_user_id = auth.uid() or public.get_user_role() in ('moderator', 'admin'));

-- Add organization linkage
alter table public.success_reports
  add column submitted_by_organization_id uuid references public.organizations(id);

-- Replace single `body` with structured evidence fields
alter table public.success_reports rename column body to report_summary;

alter table public.success_reports
  add column pilot_date_range text,
  add column deployment_scope text,
  add column kpi_summary text,
  add column evidence_notes text,
  add column optional_attachment_refs jsonb default '[]'::jsonb;

-- Add dual anonymity
alter table public.success_reports
  add column is_publicly_anonymous boolean not null default false,
  add column is_org_anonymous boolean not null default false;

-- Backfill anonymity from old column
update public.success_reports set is_publicly_anonymous = anonymous;
alter table public.success_reports drop column anonymous;

-- Add verification_status (trust semantics, separate from moderation status)
alter table public.success_reports
  add column verification_status text not null default 'submitted'
    check (verification_status in ('submitted', 'under_review', 'verified', 'rejected'));

create index idx_success_reports_verification on public.success_reports(verification_status);
create index idx_success_reports_org on public.success_reports(submitted_by_organization_id);

-- ============================================================
-- 3. UPDATE solution_status TRIGGER to use verification_status
-- ============================================================

create or replace function public.compute_solution_status()
returns trigger as $$
declare
  pid uuid;
  has_verified_report boolean;
  has_approach boolean;
begin
  -- Determine which problem_id to recompute
  if tg_table_name = 'solution_approaches' then
    pid := coalesce(new.problem_id, old.problem_id);
  elsif tg_table_name = 'success_reports' then
    select sa.problem_id into pid
    from public.solution_approaches sa
    where sa.id = coalesce(new.solution_approach_id, old.solution_approach_id);
  end if;

  if pid is null then return coalesce(new, old); end if;

  -- Only VERIFIED success reports trigger successful_pilot
  select exists (
    select 1 from public.success_reports sr
    join public.solution_approaches sa on sa.id = sr.solution_approach_id
    where sa.problem_id = pid and sr.verification_status = 'verified'
  ) into has_verified_report;

  select exists (
    select 1 from public.solution_approaches sa
    where sa.problem_id = pid and sa.status = 'published'
  ) into has_approach;

  update public.problem_templates set solution_status =
    case
      when has_verified_report then 'successful_pilot'
      when has_approach then 'has_approaches'
      else 'unsolved'
    end
  where id = pid;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Re-create triggers to also fire on verification_status changes
drop trigger if exists recompute_solution_status_on_report on public.success_reports;
create trigger recompute_solution_status_on_report
  after insert or update of status, verification_status or delete on public.success_reports
  for each row execute function public.compute_solution_status();

-- ============================================================
-- 4. ADD NOTIFICATION TYPES for new workflows
-- ============================================================

-- Expand notification_preferences with new event types
alter table public.notification_preferences
  add column email_verification_outcomes boolean not null default true,
  add column email_success_report_decisions boolean not null default true,
  add column email_revision_reverted boolean not null default true;

-- Update notifications type check to allow new types
-- (Postgres doesn't support ALTER CHECK directly, so drop and re-add)
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'status_change', 'suggested_edit', 'comment_reply',
    'verification_outcome', 'success_report_decision', 'revision_reverted'
  ));
