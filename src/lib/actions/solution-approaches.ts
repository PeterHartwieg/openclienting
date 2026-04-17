"use server";

import { createClient } from "@/lib/supabase/server";
import { detectLanguage } from "@/lib/i18n/detect-language";
import { resolveVerifiedMembership } from "@/lib/auth/org-membership";
import type { TechnologyType, Maturity } from "@/lib/types/database";
import { invalidateForMany } from "@/lib/cache/tags";

export async function submitSolutionApproach(params: {
  problemId: string;
  title: string;
  description: string;
  technologyType: TechnologyType;
  maturity: Maturity;
  complexity?: string;
  priceRange?: string;
  isPubliclyAnonymous: boolean;
  isOrgAnonymous: boolean;
  organizationId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in to contribute" };
  if (!params.title.trim()) return { success: false, error: "Title is required" };
  if (!params.description.trim()) return { success: false, error: "Description is required" };

  const membership = await resolveVerifiedMembership(
    supabase,
    user.id,
    params.organizationId,
  );
  if (!membership.ok) return { success: false, error: membership.error };

  const { error } = await supabase.from("solution_approaches").insert({
    problem_id: params.problemId,
    title: params.title.trim(),
    description: params.description.trim(),
    technology_type: params.technologyType,
    maturity: params.maturity,
    complexity: params.complexity?.trim() || null,
    price_range: params.priceRange?.trim() || null,
    author_id: user.id,
    author_organization_id: params.organizationId ?? null,
    is_publicly_anonymous: params.isPubliclyAnonymous,
    is_org_anonymous: params.isOrgAnonymous,
    status: "submitted",
    // Description is usually long enough for franc to classify;
    // prepend the title for a little extra signal.
    source_language: detectLanguage(
      `${params.title.trim()}\n\n${params.description.trim()}`,
    ),
  });

  if (error) return { success: false, error: error.message };

  // getPublishedProblemForMarkdown joins solution_approaches without filtering
  // by child status, so a newly submitted solution appears in the cached
  // problem detail. Bust problem_templates; also bust solution_approaches so
  // the home stats loader reflects the new submission count.
  invalidateForMany(["solution", "problem"]);
  return { success: true };
}
