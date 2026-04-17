-- ============================================================
-- 20260418000000_search_problems_plaintext_snippet.sql
-- Replace ts_headline HTML output with sentinel-wrapped plain text.
--
-- Previous migration used StartSel=<b>,StopSel=</b> which let any
-- HTML in user-authored descriptions become an XSS vector when the
-- client rendered the snippet with dangerouslySetInnerHTML.
--
-- New approach: sentinels «OC-M» / «/OC-M» are:
--   - Multi-char, making them improbable in real user text
--   - Not valid HTML, so if accidentally rendered as raw HTML they
--     produce no executable markup
-- The client (global-search.tsx) splits on these sentinels and
-- renders matched segments as React <b> elements, so React escapes
-- all text content automatically.
-- ============================================================

create or replace function public.search_problems(q text, lim int default 8)
returns table (
  id      uuid,
  title   text,
  snippet text,
  rank    real
)
language sql
security invoker
stable
as $$
  select
    pt.id,
    pt.title,
    ts_headline(
      'simple',
      coalesce(pt.description, ''),
      plainto_tsquery('simple', q),
      'MaxFragments=1,MaxWords=30,MinWords=10,HighlightAll=false,StartSel=«OC-M»,StopSel=«/OC-M»'
    ) as snippet,
    ts_rank(pt.search_tsv, plainto_tsquery('simple', q)) as rank
  from public.problem_templates pt
  where
    pt.status = 'published'
    and pt.search_tsv @@ plainto_tsquery('simple', q)
  order by rank desc, pt.created_at desc
  limit lim;
$$;

grant execute on function public.search_problems(text, int) to anon, authenticated;
