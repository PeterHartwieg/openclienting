-- ============================================================
-- OpenClienting.org — Suggested Edits (Wikipedia-style)
-- ============================================================

create table public.suggested_edits (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in (
    'problem_template', 'requirement', 'pilot_framework', 'solution_approach'
  )),
  target_id uuid not null,
  diff jsonb not null, -- { fieldName: { old: "...", new: "..." } }
  author_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suggested_edits enable row level security;

create index idx_suggested_edits_target on public.suggested_edits(target_type, target_id);
create index idx_suggested_edits_status on public.suggested_edits(status);

create trigger set_updated_at before update on public.suggested_edits
  for each row execute function public.handle_updated_at();

-- Author sees own; moderators/admins see all
create policy "suggested_edits_select" on public.suggested_edits for select
  using (
    author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

create policy "suggested_edits_insert" on public.suggested_edits for insert
  with check (auth.uid() is not null and author_id = auth.uid());

-- Only moderators can update status (approve/reject)
create policy "suggested_edits_update" on public.suggested_edits for update
  using (public.get_user_role() in ('moderator', 'admin'));
