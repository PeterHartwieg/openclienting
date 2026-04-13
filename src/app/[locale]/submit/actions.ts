"use server";

import { createClient } from "@/lib/supabase/server";

interface ProblemSubmission {
  title: string;
  description: string;
  isPubliclyAnonymous: boolean;
  isOrgAnonymous: boolean;
  organizationId?: string;
  tagIds: string[];
  requirements: string[];
  pilotFramework: {
    scope: string;
    suggested_kpis: string;
    success_criteria: string;
    common_pitfalls: string;
    duration: string;
    resource_commitment: string;
  };
}

export async function submitProblem(data: ProblemSubmission) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to submit a problem." };
  }

  // Validate
  if (!data.title.trim()) {
    return { success: false, error: "Title is required." };
  }
  if (!data.description.trim()) {
    return { success: false, error: "Description is required." };
  }
  if (data.tagIds.length === 0) {
    return { success: false, error: "At least one tag is required." };
  }

  // Insert problem
  const { data: problem, error: problemError } = await supabase
    .from("problem_templates")
    .insert({
      title: data.title.trim(),
      description: data.description.trim(),
      author_id: user.id,
      author_organization_id: data.organizationId ?? null,
      is_publicly_anonymous: data.isPubliclyAnonymous,
      is_org_anonymous: data.isOrgAnonymous,
      status: "submitted",
    })
    .select("id")
    .single();

  if (problemError) {
    return { success: false, error: problemError.message };
  }

  // Insert tags
  if (data.tagIds.length > 0) {
    const { error: tagError } = await supabase.from("problem_tags").insert(
      data.tagIds.map((tagId) => ({
        problem_id: problem.id,
        tag_id: tagId,
      }))
    );
    if (tagError) {
      return { success: false, error: tagError.message };
    }
  }

  // Insert requirements
  const nonEmptyReqs = data.requirements.filter((r) => r.trim());
  if (nonEmptyReqs.length > 0) {
    const { error: reqError } = await supabase.from("requirements").insert(
      nonEmptyReqs.map((body) => ({
        problem_id: problem.id,
        body: body.trim(),
        author_id: user.id,
        author_organization_id: data.organizationId ?? null,
        is_publicly_anonymous: data.isPubliclyAnonymous,
        is_org_anonymous: data.isOrgAnonymous,
        status: "submitted" as const,
      }))
    );
    if (reqError) {
      return { success: false, error: reqError.message };
    }
  }

  // Insert pilot framework (if any fields provided)
  const pf = data.pilotFramework;
  const hasFrameworkData = Object.values(pf).some((v) => v.trim());
  if (hasFrameworkData) {
    const { error: pfError } = await supabase.from("pilot_frameworks").insert({
      problem_id: problem.id,
      scope: pf.scope.trim() || null,
      suggested_kpis: pf.suggested_kpis.trim() || null,
      success_criteria: pf.success_criteria.trim() || null,
      common_pitfalls: pf.common_pitfalls.trim() || null,
      duration: pf.duration.trim() || null,
      resource_commitment: pf.resource_commitment.trim() || null,
      author_id: user.id,
      author_organization_id: data.organizationId ?? null,
      is_publicly_anonymous: data.isPubliclyAnonymous,
      is_org_anonymous: data.isOrgAnonymous,
      status: "submitted" as const,
    });
    if (pfError) {
      return { success: false, error: pfError.message };
    }
  }

  return { success: true, problemId: problem.id };
}
