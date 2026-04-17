-- ============================================================
-- 20260418000700_featured_success_report.sql
--
-- Moderator-curated featured success story for the marketing
-- homepage. One row per (success_report, locale) pair; soft-
-- deleted via unfeatured_at rather than hard DELETE so history
-- is preserved.
-- ============================================================

create table public.featured_success_report (
  id                    uuid primary key default gen_random_uuid(),
  success_report_id     uuid not null references public.success_reports(id) on delete cascade,
  locale                text not null check (locale in (
    'ar','bn','cs','da','de','el','en','es','fi','fr',
    'he','hi','hu','id','it','ja','ko','mn','nl','no',
    'pl','pt','ro','ru','sv','sw','th','tr','uk','vi','zh'
  )),
  display_order         int not null default 0,
  featured_by           uuid not null references auth.users(id),
  featured_at           timestamptz not null default now(),
  unfeatured_at         timestamptz,
  unique (success_report_id, locale)
);

-- Index for the public homepage query: filter by locale + live rows, order by display_order
create index featured_success_report_locale_idx
  on public.featured_success_report (locale, display_order)
  where unfeatured_at is null;

alter table public.featured_success_report enable row level security;

-- Public can read live (non-unfeatured) rows only.
-- The success_report itself is already RLS-protected; this table just
-- gates which reports get surfaced on the homepage.
create policy fsr_public_read on public.featured_success_report
  for select using (unfeatured_at is null);

-- Moderators and admins can insert, update, and delete rows.
-- Uses the SECURITY DEFINER helper from 20260418000400 to avoid
-- RLS recursion on the profiles table.
create policy fsr_mod_all on public.featured_success_report
  for all
  using (public.is_moderator_or_admin())
  with check (public.is_moderator_or_admin());
