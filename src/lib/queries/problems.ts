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

const getPublishedProblemsCached = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("problem_templates")
      .select(`
        *,
        problem_tags (
          tag_id,
          tags (id, name, slug, category)
        ),
        profiles!problem_templates_author_id_fkey (display_name),
        organizations!problem_templates_author_organization_id_fkey (id, name)
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
  ["problems:published"],
  { revalidate: 300, tags: ["problem_templates", "tags"] },
);

export async function getPublishedProblems(filters: ProblemFilters = {}) {
  // Client-side filtering avoids interpolating user input into PostgREST
  // filter strings, which have no reliable escape mechanism for structural
  // characters such as commas, dots, and parentheses.
  let results = await getPublishedProblemsCached();

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }
  for (const category of [
    "industry",
    "function",
    "problem_category",
    "company_size",
  ] as const) {
    const slug = filters[category];
    if (slug) {
      results = results.filter((problem) =>
        problem.problem_tags?.some(
          (pt: { tags: { slug: string; category: string } | null }) =>
            pt.tags?.slug === slug && pt.tags?.category === category,
        ),
      );
    }
  }

  if (filters.solution_status) {
    results = results.filter(
      (p) => p.solution_status === filters.solution_status,
    );
  }

  return results;
}

// Anonymous-readable variant of `getProblemById` used by the Markdown route
// handlers. Uses the public Supabase client (no cookies) so the route
// handler stays outside Next.js' dynamic-function set and can be cached at
// Vercel's edge via `export const revalidate`. Filters on
// `status = published` defensively — unpublished problems must never surface
// in the Markdown mirror even if a caller forgets the check. Shares cache
// tags with `getPublishedProblemsCached` so existing revalidation (on
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
        organizations!problem_templates_author_organization_id_fkey (id, name),
        requirements (
          id, body, is_publicly_anonymous, is_org_anonymous, status, upvote_count, created_at, author_id,
          profiles!requirements_author_id_fkey (display_name),
          organizations!requirements_author_organization_id_fkey (id, name)
        ),
        pilot_frameworks (
          id, scope, suggested_kpis, success_criteria, common_pitfalls,
          duration, resource_commitment, is_publicly_anonymous, is_org_anonymous, status, upvote_count, created_at, author_id,
          profiles!pilot_frameworks_author_id_fkey (display_name),
          organizations!pilot_frameworks_author_organization_id_fkey (id, name)
        ),
        solution_approaches (
          id, title, description, technology_type, maturity, complexity, price_range,
          is_publicly_anonymous, is_org_anonymous, status, upvote_count, created_at, author_id,
          profiles!solution_approaches_author_id_fkey (display_name),
          organizations!solution_approaches_author_organization_id_fkey (id, name),
          success_reports (
            id, report_summary, pilot_date_range, deployment_scope, kpi_summary, evidence_notes,
            is_publicly_anonymous, is_org_anonymous, status, verification_status, created_at,
            submitted_by_organization_id,
            profiles!success_reports_author_id_fkey (display_name),
            organizations!success_reports_submitted_by_organization_id_fkey (id, name)
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
      organizations!problem_templates_author_organization_id_fkey (id, name),
      requirements (
        id, body, is_publicly_anonymous, is_org_anonymous, status, upvote_count, created_at, author_id,
        profiles!requirements_author_id_fkey (display_name),
        organizations!requirements_author_organization_id_fkey (id, name)
      ),
      pilot_frameworks (
        id, scope, suggested_kpis, success_criteria, common_pitfalls,
        duration, resource_commitment, is_publicly_anonymous, is_org_anonymous, status, upvote_count, created_at, author_id,
        profiles!pilot_frameworks_author_id_fkey (display_name),
        organizations!pilot_frameworks_author_organization_id_fkey (id, name)
      ),
      solution_approaches (
        id, title, description, technology_type, maturity, complexity, price_range,
        is_publicly_anonymous, is_org_anonymous, status, upvote_count, created_at, author_id,
        profiles!solution_approaches_author_id_fkey (display_name),
        organizations!solution_approaches_author_organization_id_fkey (id, name),
        success_reports (
          id, report_summary, pilot_date_range, deployment_scope, kpi_summary, evidence_notes,
          is_publicly_anonymous, is_org_anonymous, status, verification_status, created_at,
          submitted_by_organization_id,
          profiles!success_reports_author_id_fkey (display_name),
          organizations!success_reports_submitted_by_organization_id_fkey (id, name)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return problem;
});
