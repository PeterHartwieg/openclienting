"use server";

import { updateTag } from "next/cache";
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
  // RPC shares the same org id across all child inserts.
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

  // Build pilot framework entry if any field is non-empty
  const pf = data.pilotFramework;
  const hasFrameworkData = Object.values(pf).some((v) => v.trim());
  const pilotFrameworks = hasFrameworkData
    ? [
        {
          scope: pf.scope.trim() || null,
          suggested_kpis: pf.suggested_kpis.trim() || null,
          success_criteria: pf.success_criteria.trim() || null,
          common_pitfalls: pf.common_pitfalls.trim() || null,
          duration: pf.duration.trim() || null,
          resource_commitment: pf.resource_commitment.trim() || null,
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
        },
      ]
    : [];

  // Build requirements entries (non-empty strings only)
  const nonEmptyReqs = data.requirements.filter((r) => r.trim());
  const requirements = nonEmptyReqs.map((body) => ({
    body: body.trim(),
    // Each requirement is short on its own, so fall back to the
    // parent problem's detected language rather than re-detecting
    // per item (where detection would almost always hit the
    // too-short-to-classify fallback).
    source_language: problemSourceLanguage,
  }));

  // Build the RPC payload — all 4 child types in one atomic call
  const payload = {
    title: data.title.trim(),
    description: data.description.trim(),
    is_publicly_anonymous: data.isPubliclyAnonymous,
    is_org_anonymous: data.isOrgAnonymous,
    author_organization_id: data.organizationId ?? null,
    source_language: problemSourceLanguage,
    tag_ids: data.tagIds,
    requirements,
    pilot_frameworks: pilotFrameworks,
  };

  const { data: problemId, error } = await supabase.rpc("submit_problem_v1", {
    p_payload: payload,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Invalidate caches so server-component lists pick up the new problem
  updateTag("problem_templates");
  updateTag("moderation_events");

  return { success: true, problemId: problemId as string };
}
