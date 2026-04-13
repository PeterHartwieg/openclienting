-- ============================================================
-- OpenClienting.org — Notifications
-- ============================================================

-- Notification preferences (opt-out model)
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_status_changes boolean not null default true,
  email_suggested_edits boolean not null default true,
  email_comment_replies boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.handle_updated_at();

create policy "notif_prefs_select" on public.notification_preferences for select
  using (user_id = auth.uid());
create policy "notif_prefs_insert" on public.notification_preferences for insert
  with check (user_id = auth.uid());
create policy "notif_prefs_update" on public.notification_preferences for update
  using (user_id = auth.uid());

-- Notification log (for dashboard history)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('status_change', 'suggested_edit', 'comment_reply')),
  title text not null,
  body text,
  link text, -- relative URL to the relevant page
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index idx_notifications_user on public.notifications(user_id, created_at desc);

create policy "notifications_select" on public.notifications for select
  using (user_id = auth.uid());
create policy "notifications_update" on public.notifications for update
  using (user_id = auth.uid());
-- Insert is done by edge functions or server actions with service role
create policy "notifications_insert" on public.notifications for insert
  with check (auth.uid() is not null);
