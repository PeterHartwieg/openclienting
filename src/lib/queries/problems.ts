import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

export interface ProblemFilters {
  q?: string;
  industry?: string;
  function?: string;
  problem_category?: string;
  company_size?: string;
  solution_status?: string;
}

export interface ProblemListRow {
  id: string;
  title: string;
  description: string;
  status: string;
  solution_status: string | null;
  is_publicly_anonymous: boolean;
  is_org_anonymous: boolean;
  author_id: string | null;
  author_organization_id: string | null;
  source_language: string | null;
  created_at: string;
  updated_at: string | null;
  problem_tags: Array<{
    tag_id: string;
    tags: {
      id: string;
      name: string;
      slug: string;
      category: string;
    } | null;
  }> | null;
  profiles: { display_name: string | null } | null;
  organizations: {
    id: string;
    name: string;
    slug: string;
    verification_status: string;
  } | null;
}

export interface ProblemsPage {
  rows: ProblemListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_PROBLEMS_PAGE_SIZE = 24;

// Full-text search uses the generated `search_tsv` column on
// problem_templates (migration 028) with `simple` config, matching the
// column's generation expression. `websearch` gives user-friendly syntax
// (quoted phrases, OR, negation) that the Supabase builder URL-encodes
// safely — no string interpolation into PostgREST filter expressions.
const PROBLEM_LIST_SELECT = `
  id, title, description, status, solution_status, is_publicly_anonymous,
  is_org_anonymous, author_id, author_organization_id, source_language,
  created_at, updated_at,
  problem_tags (
    tag_id,
    tags (id, name, slug, category)
  ),
  profiles!problem_templates_author_id_fkey (display_name),
  organizations!problem_templates_author_organization_id_fkey (id, name, slug, verification_status)
`;

/**
 * Paginated, filtered, database-backed fetch of published problems.
 * Replaces the "load everything + filter in memory" pattern the review
 * flagged. Each filter maps to a native Supabase builder operator; the
 * builder handles escaping so user-supplied `q` and tag slugs cannot
 * break the PostgREST filter grammar.
 *
 * Tag filtering uses distinct aliased `!inner` joins — one per category
 * filter — so multiple tag filters AND together rather than returning
 * problems that match any one tag.
 */
export async function getPublishedProblemsPage({
  filters = {},
  page = 1,
  pageSize = DEFAULT_PROBLEMS_PAGE_SIZE,
}: {
  filters?: ProblemFilters;
  page?: number;
  pageSize?: number;
} = {}): Promise<ProblemsPage> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safeSize =
    Number.isFinite(pageSize) && pageSize >= 1 && pageSize <= 100
      ? Math.floor(pageSize)
      : DEFAULT_PROBLEMS_PAGE_SIZE;

  const supabase = createPublicClient();

  // Build the per-category inner joins dynamically. Each aliased join
  // must be reflected in both the select string and a matching `.eq`
  // that scopes it to the chosen slug/category pair. PostgREST allows
  // this because each alias is treated as its own relationship chain.
  const tagFilterCategories = (
    ["industry", "function", "problem_category", "company_size"] as const
  ).filter((category) => {
    const slug = filters[category];
    return typeof slug === "string" && slug.length > 0;
  });

  const joinAliases = tagFilterCategories.map((category) => {
    // Alias names must be valid identifiers; category strings already match.
    return `pt_${category}:problem_tags!inner(tag:tags!inner(slug, category))`;
  });

  const selectString = [PROBLEM_LIST_SELECT, ...joinAliases]
    .map((s) => s.trim())
    .join(",\n  ");

  let query = supabase
    .from("problem_templates")
    .select(selectString, { count: "exact" })
    .eq("status", "published");

  if (filters.q && filters.q.trim().length > 0) {
    query = query.textSearch("search_tsv", filters.q.trim(), {
      type: "websearch",
      config: "simple",
    });
  }

  for (const category of tagFilterCategories) {
    const slug = filters[category] as string;
    query = query
      .eq(`pt_${category}.tag.slug`, slug)
      .eq(`pt_${category}.tag.category`, category);
  }

  if (filters.solution_status) {
    query = query.eq("solution_status", filters.solution_status);
  }

  const offset = (safePage - 1) * safeSize;
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + safeSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("getPublishedProblemsPage error:", error);
    return { rows: [], total: 0, page: safePage, pageSize: safeSize };
  }

  return {
    rows: (data ?? []) as unknown as ProblemListRow[],
    total: count ?? 0,
    page: safePage,
    pageSize: safeSize,
  };
}

/**
 * Backwards-compatible thin wrapper. Callers that don't need pagination
 * (home featured strip) still work. The sitemap uses
 * {@link getAllPublishedProblemIds} instead, which is cached and cheap.
 */
export async function getPublishedProblems(filters: ProblemFilters = {}) {
  const { rows } = await getPublishedProblemsPage({
    filters,
    page: 1,
    pageSize: DEFAULT_PROBLEMS_PAGE_SIZE,
  });
  return rows;
}

/**
 * Sitemap-friendly snapshot of every published problem id + updated_at.
 * No joins, no full body, no user-provided filters — safe to cache
 * aggressively with the existing `problem_templates` tag so moderator
 * publish/reject actions still invalidate it.
 */
export const getAllPublishedProblemIds = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("problem_templates")
      .select("id, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getAllPublishedProblemIds error:", error);
      return [];
    }
    return data ?? [];
  },
  ["problems:published-ids"],
  { revalidate: 3600, tags: ["problem_templates"] },
);

// Anonymous-readable variant of `getProblemById` used by the Markdown route
// handlers. Uses the public Supabase client (no cookies) so the route
// handler stays outside Next.js' dynamic-function set and can be cached at
// Vercel's edge via `export const revalidate`. Filters on
// `status = published` defensively — unpublished problems must never surface
// in the Markdown mirror even if a caller forgets the check. Shares cache
// tags with `getAllPublishedProblemIds` so existing revalidation (on
// problem publish/edit) busts both caches together.
export const getPublishedProblemForMarkdown = unstable_cache(
  async (id: string) => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("problem_templates")
      .select(`
        *,
        problem_tags (
          tag_id,
          tags (id, name, name_de, slug, category)
        ),
        profiles!problem_templates_author_id_fkey (display_name),
        organizations!problem_templates_author_organization_id_fkey (id, name, slug, verification_status),
        requirements (
          id, body, is_publicly_anonymous, is_org_anonymous, status, source_language, upvote_count, created_at, author_id,
          profiles!requirements_author_id_fkey (display_name),
          organizations!requirements_author_organization_id_fkey (id, name, slug, verification_status)
        ),
        pilot_frameworks (
          id, scope, suggested_kpis, success_criteria, common_pitfalls,
          duration, resource_commitment, is_publicly_anonymous, is_org_anonymous, status, source_language, upvote_count, created_at, author_id,
          profiles!pilot_frameworks_author_id_fkey (display_name),
          organizations!pilot_frameworks_author_organization_id_fkey (id, name, slug, verification_status)
        ),
        solution_approaches (
          id, title, description, technology_type, maturity, complexity, price_range,
          is_publicly_anonymous, is_org_anonymous, status, source_language, upvote_count, created_at, author_id,
          profiles!solution_approaches_author_id_fkey (display_name),
          organizations!solution_approaches_author_organization_id_fkey (id, name, slug, verification_status),
          success_reports (
            id, report_summary, pilot_date_range, deployment_scope, kpi_summary, evidence_notes,
            is_publicly_anonymous, is_org_anonymous, status, verification_status, created_at,
            submitted_by_organization_id,
            profiles!success_reports_author_id_fkey (display_name),
            organizations!success_reports_submitted_by_organization_id_fkey (id, name, slug, verification_status)
          )
        )
      `)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (error) return null;
    return data;
  },
  ["problem-markdown"],
  { revalidate: 3600, tags: ["problem_templates", "tags"] },
);

// Wrapped in React.cache so generateMetadata and the page body share one
// round-trip per request. Without this, the deep join below runs twice per
// problem-detail request.
export const getProblemById = cache(async (id: string) => {
  const supabase = await createClient();

  const { data: problem, error } = await supabase
    .from("problem_templates")
    .select(`
      *,
      problem_tags (
        tag_id,
        tags (id, name, slug, category)
      ),
      profiles!problem_templates_author_id_fkey (display_name),
      organizations!problem_templates_author_organization_id_fkey (id, name, slug, verification_status),
      requirements (
        id, body, is_publicly_anonymous, is_org_anonymous, status, source_language, upvote_count, created_at, author_id,
        profiles!requirements_author_id_fkey (display_name),
        organizations!requirements_author_organization_id_fkey (id, name, slug, verification_status)
      ),
      pilot_frameworks (
        id, scope, suggested_kpis, success_criteria, common_pitfalls,
        duration, resource_commitment, is_publicly_anonymous, is_org_anonymous, status, source_language, upvote_count, created_at, author_id,
        profiles!pilot_frameworks_author_id_fkey (display_name),
        organizations!pilot_frameworks_author_organization_id_fkey (id, name, slug, verification_status)
      ),
      solution_approaches (
        id, title, description, technology_type, maturity, complexity, price_range,
        is_publicly_anonymous, is_org_anonymous, status, source_language, upvote_count, created_at, author_id,
        profiles!solution_approaches_author_id_fkey (display_name),
        organizations!solution_approaches_author_organization_id_fkey (id, name, slug, verification_status),
        success_reports (
          id, report_summary, pilot_date_range, deployment_scope, kpi_summary, evidence_notes,
          is_publicly_anonymous, is_org_anonymous, status, verification_status, created_at,
          submitted_by_organization_id,
          profiles!success_reports_author_id_fkey (display_name),
          organizations!success_reports_submitted_by_organization_id_fkey (id, name, slug, verification_status)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return problem;
});
