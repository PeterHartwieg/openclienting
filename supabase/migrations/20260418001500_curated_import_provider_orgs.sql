-- ============================================================
-- 20260418001500_curated_import_provider_orgs.sql
--
-- Extends curated imports to persist a source-supported solution-provider
-- organization link directly on the imported problem row.
--
-- Rationale:
-- - Curated packets already carry `solution_provider_organization`
-- - The existing import path had no safe place to store it
-- - Using solution_approaches would require invented fields
--   (technology_type, maturity, etc.), which is not acceptable
-- - A direct nullable org link preserves the entity without inventing facts
-- ============================================================

alter table public.problem_templates
  add column if not exists solution_provider_organization_id uuid
    references public.organizations(id);

create index if not exists idx_problem_templates_solution_provider_org
  on public.problem_templates(solution_provider_organization_id);

