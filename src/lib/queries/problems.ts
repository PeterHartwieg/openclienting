import { createClient } from "@/lib/supabase/server";

export interface ProblemFilters {
  q?: string;
  industry?: string;
  function?: string;
  problem_category?: string;
  company_size?: string;
}

export async function getPublishedProblems(filters: ProblemFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("problem_templates")
    .select(`
      *,
      problem_tags (
        tag_id,
        tags (id, name, slug, category)
      ),
      profiles!problem_templates_author_id_fkey (display_name)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Simple ILIKE search for MVP — strip PostgREST structural chars (,.()) that
  // cannot be escaped in filter values, then collapse whitespace.
  if (filters.q) {
    const sanitized = filters.q.replace(/[,.*()\\]/g, " ").replace(/\s+/g, " ").trim();
    if (sanitized) {
      query = query.or(
        `title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`
      );
    }
  }

  // Tag-based filters: filter problems that have a tag with the given slug in the given category
  const tagFilters: string[] = [];
  for (const category of ["industry", "function", "problem_category", "company_size"] as const) {
    const slug = filters[category];
    if (slug) {
      tagFilters.push(slug);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  // Client-side tag filtering (Supabase doesn't support nested relation filters well)
  let results = data ?? [];
  for (const category of ["industry", "function", "problem_category", "company_size"] as const) {
    const slug = filters[category];
    if (slug) {
      results = results.filter((problem) =>
        problem.problem_tags?.some(
          (pt: { tags: { slug: string; category: string } | null }) =>
            pt.tags?.slug === slug && pt.tags?.category === category
        )
      );
    }
  }

  return results;
}

export async function getProblemById(id: string) {
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
      requirements (
        id, body, anonymous, status, upvote_count, created_at,
        profiles!requirements_author_id_fkey (display_name)
      ),
      pilot_frameworks (
        id, scope, suggested_kpis, success_criteria, common_pitfalls,
        duration, resource_commitment, anonymous, status, upvote_count, created_at,
        profiles!pilot_frameworks_author_id_fkey (display_name)
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return problem;
}
