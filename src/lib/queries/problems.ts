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

  const query = supabase
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

  const { data, error } = await query;
  if (error) throw error;

  // Client-side filtering — avoids interpolating user input into PostgREST
  // filter strings, which have no reliable escape mechanism for structural
  // characters (commas, dots, parens).
  let results = data ?? [];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
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
