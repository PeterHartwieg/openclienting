-- ============================================================
-- 20260418001100_content_provenance.sql
--
-- Adds three provenance mechanisms for editorially curated content:
--
--   1. content_origin   — column on problem_templates distinguishing
--      user-submitted from editorial-curated problems.
--
--   2. packet_id        — stable external identifier on
--      problem_templates that makes batch imports idempotent.
--      NULL for all user-submitted content; NULLs do not
--      conflict with the UNIQUE constraint (SQL standard).
--
--   3. content_citations — normalized citation storage following
--      the target_type / target_id pattern used by moderation_event.
--      is_sourced_fact distinguishes direct evidence (true) from
--      editorial inference (false), matching the packet-schema
--      source_basis field.
--
-- No existing data is changed. All new columns default to values
-- that preserve current behaviour for user-submitted content.
-- ============================================================

-- ── 1. Provenance flag ───────────────────────────────────────

alter table public.problem_templates
  add column content_origin text not null default 'user_submitted'
    check (content_origin in ('user_submitted', 'editorial_curated'));

comment on column public.problem_templates.content_origin is
  'user_submitted = contributor-created; '
  'editorial_curated = sourced by OpenClienting.org editorial team via import_curated_problem_v1';

-- ── 2. Idempotency key ───────────────────────────────────────

alter table public.problem_templates
  add column packet_id text unique;

comment on column public.problem_templates.packet_id is
  'Stable identifier from the curation packet (packet_schema.yaml → packet_id). '
  'NULL for user-submitted content. UNIQUE prevents duplicate imports of the same packet.';

-- ── 3. Citations table ───────────────────────────────────────

create table public.content_citations (
  id              uuid        primary key default gen_random_uuid(),
  target_type     text        not null
                    check (target_type in ('problem_template', 'requirement', 'solution_approach')),
  target_id       uuid        not null,
  source_url      text        not null,
  source_title    text,
  publisher       text,
  source_type     text        check (source_type in ('primary', 'secondary')),
  access_date     date,
  evidence_note   text,
  -- true  = the source directly supports the claim (packet source_basis='direct')
  -- false = editorial inference drawn from the source (packet source_basis='inference')
  is_sourced_fact boolean     not null default true,
  created_by      uuid        not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now()
);

create index content_citations_target_idx
  on public.content_citations (target_type, target_id);

comment on table public.content_citations is
  'Structured citations for editorially curated content. '
  'Written exclusively via import_curated_problem_v1 (SECURITY DEFINER); no direct-insert RLS policy.';

comment on column public.content_citations.is_sourced_fact is
  'true = direct evidence in source; false = editorial inference. '
  'Maps to packet-schema source_basis field (direct → true, inference → false).';

alter table public.content_citations enable row level security;

-- Moderators and admins see all citations
create policy "mods_read_all_citations"
  on public.content_citations
  for select
  using (is_moderator_or_admin());

-- Public sees citations whose parent problem is published
create policy "public_reads_published_problem_citations"
  on public.content_citations
  for select
  using (
    target_type = 'problem_template'
    and exists (
      select 1 from public.problem_templates pt
      where pt.id = content_citations.target_id
        and pt.status = 'published'
    )
  );
