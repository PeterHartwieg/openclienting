-- ============================================================
-- OpenClienting.org — Solution Approaches
-- ============================================================

-- Solution Approaches (N per problem, community-submitted)
create table public.solution_approaches (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problem_templates(id) on delete cascade,
  title text not null,
  description text not null,
  technology_type text not null check (technology_type in ('software', 'hardware', 'platform', 'service')),
  maturity text not null check (maturity in ('emerging', 'growing', 'established')),
  complexity text,
  price_range text,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous boolean not null default false,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'in_review', 'published', 'rejected')),
  upvote_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.solution_approaches enable row level security;

create index idx_solution_approaches_problem on public.solution_approaches(problem_id);
create index idx_solution_approaches_status on public.solution_approaches(status);
create index idx_solution_approaches_author on public.solution_approaches(author_id);

-- Reuse existing updated_at trigger
create trigger set_updated_at before update on public.solution_approaches
  for each row execute function public.handle_updated_at();

-- RLS policies (same pattern as requirements / pilot_frameworks)
create policy "solution_approaches_select" on public.solution_approaches for select
  using (
    (status = 'published' and exists (
      select 1 from public.problem_templates pt
      where pt.id = problem_id and pt.status = 'published'
    ))
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

create policy "solution_approaches_insert" on public.solution_approaches for insert
  with check (auth.uid() is not null and author_id = auth.uid());

create policy "solution_approaches_update" on public.solution_approaches for update
  using (author_id = auth.uid() or public.get_user_role() in ('moderator', 'admin'));

-- ============================================================
-- Extend votes to support solution_approach
-- ============================================================

-- Drop and recreate the check constraint on target_type
alter table public.votes drop constraint votes_target_type_check;
alter table public.votes add constraint votes_target_type_check
  check (target_type in ('requirement', 'pilot_framework', 'solution_approach'));

-- Drop and recreate vote insert policy to include solution_approach
drop policy "votes_insert" on public.votes;
create policy "votes_insert" on public.votes for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and (
      (target_type = 'requirement' and exists (
        select 1 from public.requirements r
        where r.id = target_id and r.status = 'published'
      ))
      or
      (target_type = 'pilot_framework' and exists (
        select 1 from public.pilot_frameworks pf
        where pf.id = target_id and pf.status = 'published'
      ))
      or
      (target_type = 'solution_approach' and exists (
        select 1 from public.solution_approaches sa
        where sa.id = target_id and sa.status = 'published'
      ))
    )
  );

-- Vote count trigger for solution_approaches
create or replace function public.update_solution_approach_vote_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' and new.target_type = 'solution_approach' then
    update public.solution_approaches set upvote_count = upvote_count + 1 where id = new.target_id;
  elsif tg_op = 'DELETE' and old.target_type = 'solution_approach' then
    update public.solution_approaches set upvote_count = greatest(upvote_count - 1, 0) where id = old.target_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_solution_approach_vote
  after insert or delete on public.votes
  for each row execute function public.update_solution_approach_vote_count();

-- ============================================================
-- Extend comments to support solution_approach
-- ============================================================

alter table public.comments drop constraint comments_target_type_check;
alter table public.comments add constraint comments_target_type_check
  check (target_type in ('problem_template', 'solution_approach'));

-- Drop and recreate comment select policy to handle solution_approach targets
drop policy "comments_select" on public.comments;
create policy "comments_select" on public.comments for select
  using (
    (target_type = 'problem_template' and exists (
      select 1 from public.problem_templates pt
      where pt.id = target_id and pt.status = 'published'
    ))
    or
    (target_type = 'solution_approach' and exists (
      select 1 from public.solution_approaches sa
      join public.problem_templates pt on pt.id = sa.problem_id
      where sa.id = target_id and sa.status = 'published' and pt.status = 'published'
    ))
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );
