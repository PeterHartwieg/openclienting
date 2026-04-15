-- ============================================================
-- OpenClienting.org — Source language tracking
-- ============================================================
--
-- Adds a `source_language` column to every translatable content
-- table so the render path knows which language a row was originally
-- written in. Before this, the system silently assumed every row was
-- English, which meant:
--   - Non-English submissions looked like "English" on /en/ routes
--   - /de/, /ja/, etc. would try to look up translations of text that
--     was already in the target language
--   - Translation contributors saw "Original (English)" even when
--     the source was German
--
-- Language is stored as an ISO 639-1 two-letter code. The application
-- layer restricts this to the 30 languages in src/i18n/languages.ts
-- via server-side detection (franc-min) at submission time.
--
-- Default is 'en' for backfill — matches the existing content, which
-- was all written in English before this column existed.

alter table public.problem_templates
  add column source_language text not null default 'en'
  check (length(source_language) between 2 and 10);

alter table public.requirements
  add column source_language text not null default 'en'
  check (length(source_language) between 2 and 10);

alter table public.pilot_frameworks
  add column source_language text not null default 'en'
  check (length(source_language) between 2 and 10);

alter table public.solution_approaches
  add column source_language text not null default 'en'
  check (length(source_language) between 2 and 10);

-- Helpful index for the render-time language short-circuit
-- (`locale === source_language` skips translation lookup entirely).
-- Not strictly needed for correctness, but queries that filter a
-- problem tree by source language will use it.
create index idx_problem_templates_source_language
  on public.problem_templates (source_language);
