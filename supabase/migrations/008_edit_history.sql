-- ============================================================
-- OpenClienting.org — Edit History (audit log for author edits)
-- ============================================================

create table public.edit_history (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in (
    'problem_template', 'requirement', 'pilot_framework', 'solution_approach'
  )),
  target_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  diff jsonb not null, -- { fieldName: { old: "...", new: "..." } }
  created_at timestamptz not null default now()
);

alter table public.edit_history enable row level security;

create index idx_edit_history_target on public.edit_history(target_type, target_id);
create index idx_edit_history_author on public.edit_history(author_id);

-- Authors see their own edits; moderators/admins see all
create policy "edit_history_select" on public.edit_history for select
  using (
    author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

create policy "edit_history_insert" on public.edit_history for insert
  with check (auth.uid() is not null and author_id = auth.uid());
