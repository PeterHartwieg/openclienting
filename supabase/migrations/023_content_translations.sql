-- ============================================================
-- OpenClienting.org — Open-source content translations
-- ============================================================
--
-- Lets any signed-in user contribute a translation of any piece
-- of user-generated content into any language, subject to
-- moderator approval. Modelled on the polymorphic `suggested_edits`
-- pattern: one table, `target_type` + `target_id`, JSONB body.
--
-- Knowledge articles and tags keep their existing dedicated
-- translation mechanisms (knowledge_articles stores one row per
-- (slug, locale); tags has name_de on the row). This table handles
-- everything else: problem_templates, requirements, pilot_frameworks,
-- and solution_approaches. Comments and success reports are
-- intentionally excluded — comments are too high-volume to moderate
-- and success reports are evidence, not narrative.
--
-- Shape notes:
--  - `fields` is a JSONB blob of { field_name: translated_value }.
--    Each target_type has a known field allowlist enforced in the
--    application layer (see src/lib/content-translations/fields.ts).
--  - `language` is an ISO 639-1 code, not a URL locale — a translator
--    can submit content for a language that has no UI chrome yet.
--    Routing falls back UI chrome to English when no messages/xx.json
--    exists, so `/ja/problems/foo` renders Japanese content with
--    English chrome immediately after a translation is approved.
--  - `source_version` lets us flag stale translations later if the
--    source text is edited. v1 stores it but doesn't act on it.
--  - A partial unique index enforces at most one published
--    translation per (target_type, target_id, language). Duplicate
--    submissions in other statuses are fine — multiple translators
--    may independently propose the same thing and a moderator picks
--    the best one.

create table public.content_translations (
  id uuid primary key default gen_random_uuid(),

  target_type text not null check (target_type in (
    'problem_template',
    'requirement',
    'pilot_framework',
    'solution_approach'
  )),
  target_id uuid not null,

  -- ISO 639-1 code, lowercase. 2–10 chars to allow region tags later
  -- without blocking writes (e.g. 'pt-br'). Normalized to lowercase
  -- on insert by the contribution action.
  language text not null check (length(language) between 2 and 10),

  -- { field_name: "translated value", ... }
  fields jsonb not null,

  -- Stale-detection hook. v1 stamps this to the row's updated_at at
  -- submission time; v2 can use it to grey out translations that
  -- predate the source edit.
  source_version timestamptz,

  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'published', 'rejected')),

  author_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_translations enable row level security;

-- At most one published translation per (target, language).
create unique index content_translations_published_unique
  on public.content_translations (target_type, target_id, language)
  where status = 'published';

-- Lookup index for render-time merge (query by target ids + language).
create index idx_content_translations_lookup
  on public.content_translations (target_type, target_id, language, status);

-- Moderation queue index.
create index idx_content_translations_status
  on public.content_translations (status, created_at);

-- Author dashboard ("my translations").
create index idx_content_translations_author
  on public.content_translations (author_id, created_at desc);

create trigger set_updated_at_content_translations
  before update on public.content_translations
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

-- Read: published rows are world-readable; authors see their own
-- submissions (so they can track status); moderators see everything.
create policy "content_translations_select" on public.content_translations
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- Insert: signed-in users can submit translations as themselves, only
-- into 'submitted'. Moderators pass through the same check (they're
-- allowed to submit too, they just also have approval rights).
create policy "content_translations_insert" on public.content_translations
  for insert with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and status = 'submitted'
  );

-- Update: authors can edit their own pending submissions only while
-- still 'submitted' (before a moderator has claimed it). Moderators
-- can edit anything (approve/reject, fix typos in body, etc.).
create policy "content_translations_update_author" on public.content_translations
  for update using (
    author_id = auth.uid() and status = 'submitted'
  ) with check (
    author_id = auth.uid() and status = 'submitted'
  );

create policy "content_translations_update_moderator" on public.content_translations
  for update using (
    public.get_user_role() in ('moderator', 'admin')
  );

create policy "content_translations_delete_moderator" on public.content_translations
  for delete using (
    public.get_user_role() in ('moderator', 'admin')
  );
