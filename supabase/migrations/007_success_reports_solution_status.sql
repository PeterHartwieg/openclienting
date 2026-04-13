-- ============================================================
-- OpenClienting.org — Success Reports & Solution Status
-- ============================================================

-- Success Reports (N per solution approach, moderated)
create table public.success_reports (
  id uuid primary key default gen_random_uuid(),
  solution_approach_id uuid not null references public.solution_approaches(id) on delete cascade,
  body text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous boolean not null default false,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.success_reports enable row level security;

create index idx_success_reports_solution on public.success_reports(solution_approach_id);
create index idx_success_reports_status on public.success_reports(status);
create index idx_success_reports_author on public.success_reports(author_id);

-- Reuse existing updated_at trigger
create trigger set_updated_at before update on public.success_reports
  for each row execute function public.handle_updated_at();

-- RLS: visible when parent solution_approach and its problem are both published
create policy "success_reports_select" on public.success_reports for select
  using (
    (status = 'published' and exists (
      select 1 from public.solution_approaches sa
      join public.problem_templates pt on pt.id = sa.problem_id
      where sa.id = solution_approach_id
        and sa.status = 'published'
        and pt.status = 'published'
    ))
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

create policy "success_reports_insert" on public.success_reports for insert
  with check (auth.uid() is not null and author_id = auth.uid());

create policy "success_reports_update" on public.success_reports for update
  using (author_id = auth.uid() or public.get_user_role() in ('moderator', 'admin'));

-- ============================================================
-- Solution Status (computed column on problem_templates)
-- ============================================================

alter table public.problem_templates add column solution_status text not null default 'unsolved'
  check (solution_status in ('unsolved', 'has_approaches', 'successful_pilot'));

create index idx_problem_templates_solution_status on public.problem_templates(solution_status);

-- Trigger to auto-compute solution_status
create or replace function public.compute_solution_status()
returns trigger as $$
declare
  pid uuid;
  has_report boolean;
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

  select exists (
    select 1 from public.success_reports sr
    join public.solution_approaches sa on sa.id = sr.solution_approach_id
    where sa.problem_id = pid and sr.status = 'published'
  ) into has_report;

  select exists (
    select 1 from public.solution_approaches sa
    where sa.problem_id = pid and sa.status = 'published'
  ) into has_approach;

  update public.problem_templates set solution_status =
    case
      when has_report then 'successful_pilot'
      when has_approach then 'has_approaches'
      else 'unsolved'
    end
  where id = pid;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger recompute_solution_status_on_approach
  after insert or update of status or delete on public.solution_approaches
  for each row execute function public.compute_solution_status();

create trigger recompute_solution_status_on_report
  after insert or update of status or delete on public.success_reports
  for each row execute function public.compute_solution_status();
