"use server";

import { createClient } from "@/lib/supabase/server";
import { detectLanguage } from "@/lib/i18n/detect-language";
import { resolveVerifiedMembership } from "@/lib/auth/org-membership";

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

  // Block attribution spoofing: a client-supplied organizationId must
  // correspond to an active membership. Checked once here because the
  // three inserts below share the same org id.
  const membership = await resolveVerifiedMembership(
    supabase,
    user.id,
    data.organizationId,
  );
  if (!membership.ok) {
    return { success: false, error: membership.error };
  }

  // Detect source language from the problem body. Title alone is usually
  // too short to classify reliably, so we concatenate with the description.
  const problemSourceLanguage = detectLanguage(
    `${data.title.trim()}\n\n${data.description.trim()}`,
  );

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
      source_language: problemSourceLanguage,
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
        // Each requirement is short on its own, so fall back to the
        // parent problem's detected language rather than re-detecting
        // per item (where detection would almost always hit the
        // too-short-to-classify fallback).
        source_language: problemSourceLanguage,
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
      // Detect from the pilot framework's own aggregate body so a
      // framework written in German against an English problem gets
      // tagged correctly.
      source_language: detectLanguage(
        [
          pf.scope,
          pf.suggested_kpis,
          pf.success_criteria,
          pf.common_pitfalls,
          pf.duration,
          pf.resource_commitment,
        ]
          .map((f) => f.trim())
          .filter(Boolean)
          .join("\n\n"),
      ),
    });
    if (pfError) {
      return { success: false, error: pfError.message };
    }
  }

  return { success: true, problemId: problem.id };
}
