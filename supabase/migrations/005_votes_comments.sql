-- ============================================================
-- OpenClienting.org — Votes & Comments
-- ============================================================

-- Votes (one per user per target)
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('requirement', 'pilot_framework')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

alter table public.votes enable row level security;

create index idx_votes_target on public.votes(target_type, target_id);
create index idx_votes_user on public.votes(user_id);

-- RLS for votes
create policy "votes_select" on public.votes for select
  using (
    user_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );
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
    )
  );
create policy "votes_delete" on public.votes for delete
  using (user_id = auth.uid());

-- Trigger: update upvote_count on requirements
create or replace function public.update_requirement_vote_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' and new.target_type = 'requirement' then
    update public.requirements set upvote_count = upvote_count + 1 where id = new.target_id;
  elsif tg_op = 'DELETE' and old.target_type = 'requirement' then
    update public.requirements set upvote_count = greatest(upvote_count - 1, 0) where id = old.target_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_requirement_vote
  after insert or delete on public.votes
  for each row execute function public.update_requirement_vote_count();

-- Trigger: update upvote_count on pilot_frameworks
create or replace function public.update_pilot_framework_vote_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' and new.target_type = 'pilot_framework' then
    update public.pilot_frameworks set upvote_count = upvote_count + 1 where id = new.target_id;
  elsif tg_op = 'DELETE' and old.target_type = 'pilot_framework' then
    update public.pilot_frameworks set upvote_count = greatest(upvote_count - 1, 0) where id = old.target_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_pilot_framework_vote
  after insert or delete on public.votes
  for each row execute function public.update_pilot_framework_vote_count();

-- Comments (one-level threading)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('problem_template')),
  target_id uuid not null,
  body text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous boolean not null default false,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create index idx_comments_target on public.comments(target_type, target_id);

-- RLS for comments: visible if linked problem is published
create policy "comments_select" on public.comments for select
  using (
    exists (
      select 1 from public.problem_templates pt
      where pt.id = target_id and pt.status = 'published'
    )
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

create policy "comments_insert" on public.comments for insert
  with check (auth.uid() is not null and author_id = auth.uid());
