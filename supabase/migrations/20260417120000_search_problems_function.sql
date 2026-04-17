-- ============================================================
-- 20260417120000_search_problems_function.sql
-- Global problem search RPC exposed to supabase-js.
--
-- Uses plainto_tsquery('simple', ...) for multilingual compat
-- (matches 028_problems_fulltext.sql which uses the same config).
-- SECURITY INVOKER so existing RLS on problem_templates applies.
-- ============================================================

create or replace function public.search_problems(q text, lim int default 8)
returns table (
  id   uuid,
  title text,
  snippet text,
  rank  real
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
      'MaxFragments=1,MaxWords=20,MinWords=5,StartSel=<b>,StopSel=</b>'
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
