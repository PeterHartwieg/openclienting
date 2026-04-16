-- ============================================================
-- 028_problems_fulltext.sql
-- Fix P2 from PROJECT_REVIEW_SUMMARY: the browse page fetches every
-- published problem with joins and filters in memory. This migration
-- adds the indexes needed to push search + pagination down into
-- Postgres.
--
-- Strategy: a generated tsvector on title + description (weighted) with
-- a GIN index for full-text search, plus a partial index on
-- created_at DESC filtered to status='published' — the common sort and
-- predicate for the browse list.
--
-- `simple` config is used instead of `english` because the content is
-- multilingual (English + German primary, more locales in flight). The
-- search UX is substring-ish rather than stemming-driven today.
-- ============================================================

alter table public.problem_templates
  add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored;

create index idx_problem_templates_search
  on public.problem_templates
  using gin (search_tsv);

create index idx_problem_templates_published_created
  on public.problem_templates (created_at desc)
  where status = 'published';
