-- ============================================================
-- OpenClienting.org — Knowledge Articles (wiki-editable content)
-- ============================================================
--
-- Knowledge pages that were previously baked into `messages/*.json`
-- (the venture-clienting hub + 6 spokes) now live in the database so
-- they can be edited through the existing suggested-edits flow and
-- extended with user-proposed articles and user-proposed translations.
--
-- Shape notes:
--  - Rows are keyed by (slug, locale). A translation is a row, not a
--    column. This makes crowdsourced translations a first-class insert
--    flow: propose a new locale row with status='submitted', moderator
--    approves, it goes live. No locale whitelist.
--  - `kind` distinguishes the hub ('hub', slug='index') from spokes
--    ('spoke', any slug). The hub has 5 free-form sections; spokes
--    use the rigid tldr/detail/faq shape that powers schema.org
--    Article + FAQPage JSON-LD.
--  - Body arrays live as JSONB so the schema is flexible for future
--    article types. The suggest-edit flow uses JSON Patch-style
--    diffs, so array fields are stored and diffed whole.
--  - `tags` drives the "Related in this cluster" sibling auto-pick:
--    siblings are the two most-recently-published articles sharing a
--    tag. No per-row sibling list to maintain.
--
-- The accompanying migration 022 extends suggested_edits.target_type
-- with 'knowledge_article' and seeds the 14 rows that existed in the
-- i18n files (7 articles × en/de).

create table public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),

  -- (slug, locale) is the natural key. Hub uses slug='index'.
  slug text not null check (length(slug) > 0 and slug = lower(slug)),
  locale text not null check (length(locale) between 2 and 10),
  kind text not null check (kind in ('hub', 'spoke')),

  -- Core prose
  title text not null,
  short_label text,                  -- used in hub index + sibling links
  lede text not null,
  meta_title text not null,
  meta_description text not null,

  -- Spoke-only structured sections. Nullable so the hub can skip them.
  tldr_title text,
  tldr jsonb not null default '[]'::jsonb,            -- string[]
  detail_title text,
  detail_intro text,
  detail_bullets jsonb not null default '[]'::jsonb,  -- string[]
  faq_title text,
  faq jsonb not null default '[]'::jsonb,             -- [{question, answer}]

  -- Hub-only free-form sections (array of {title, body}).
  sections jsonb not null default '[]'::jsonb,

  -- Tag slugs used for sibling auto-pick and filtering. Not a FK to
  -- the `tags` table — knowledge-cluster tags are their own lightweight
  -- taxonomy that moderators curate on approval.
  tags text[] not null default '{}',

  -- Hub displays spokes in sort_order asc (stable order across edits).
  sort_order int not null default 0,

  -- Universal moderation lifecycle. Same semantics as other tables.
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'published', 'rejected')),

  -- Nullable because the 14 seeded rows have no human author.
  author_id uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (slug, locale)
);

create index idx_knowledge_articles_locale_status
  on public.knowledge_articles (locale, status);
create index idx_knowledge_articles_slug
  on public.knowledge_articles (slug);
create index idx_knowledge_articles_tags
  on public.knowledge_articles using gin (tags);

create trigger set_updated_at_knowledge_articles
  before update on public.knowledge_articles
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.knowledge_articles enable row level security;

-- Read: published rows are world-readable; authors see their own
-- submissions; moderators/admins see everything.
create policy "knowledge_articles_select" on public.knowledge_articles
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.get_user_role() in ('moderator', 'admin')
  );

-- Insert: signed-in users can propose new articles or translations,
-- but only as themselves and only into 'submitted'. Moderators can
-- still bypass this via the mod queue code path (service role).
create policy "knowledge_articles_insert" on public.knowledge_articles
  for insert with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and status = 'submitted'
  );

-- Update: authors can edit their own pending submissions only while
-- still 'submitted' (so a moderator's review can't be yanked out from
-- under them). Moderators can edit anything.
create policy "knowledge_articles_update_author" on public.knowledge_articles
  for update using (
    author_id = auth.uid() and status = 'submitted'
  ) with check (
    author_id = auth.uid() and status = 'submitted'
  );

create policy "knowledge_articles_update_moderator" on public.knowledge_articles
  for update using (
    public.get_user_role() in ('moderator', 'admin')
  );

create policy "knowledge_articles_delete_moderator" on public.knowledge_articles
  for delete using (
    public.get_user_role() in ('moderator', 'admin')
  );

-- ------------------------------------------------------------
-- Extend suggested_edits to accept knowledge_article targets
-- ------------------------------------------------------------
alter table public.suggested_edits
  drop constraint if exists suggested_edits_target_type_check;

alter table public.suggested_edits
  add constraint suggested_edits_target_type_check
  check (target_type in (
    'problem_template',
    'requirement',
    'pilot_framework',
    'solution_approach',
    'knowledge_article'
  ));
