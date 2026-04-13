"use server";

import { createClient } from "@/lib/supabase/server";
import type { TechnologyType, Maturity } from "@/lib/types/database";

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
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
