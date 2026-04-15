"use server";

import { createClient } from "@/lib/supabase/server";
import { detectLanguage } from "@/lib/i18n/detect-language";

export async function submitPilotFramework(params: {
  problemId: string;
  scope: string;
  suggestedKpis: string;
  successCriteria: string;
  commonPitfalls: string;
  duration: string;
  resourceCommitment: string;
  isPubliclyAnonymous: boolean;
  isOrgAnonymous: boolean;
  organizationId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in to contribute" };

  const { error } = await supabase.from("pilot_frameworks").insert({
    problem_id: params.problemId,
    scope: params.scope.trim() || null,
    suggested_kpis: params.suggestedKpis.trim() || null,
    success_criteria: params.successCriteria.trim() || null,
    common_pitfalls: params.commonPitfalls.trim() || null,
    duration: params.duration.trim() || null,
    resource_commitment: params.resourceCommitment.trim() || null,
    author_id: user.id,
    author_organization_id: params.organizationId ?? null,
    is_publicly_anonymous: params.isPubliclyAnonymous,
    is_org_anonymous: params.isOrgAnonymous,
    status: "submitted",
    // Detect from the framework's aggregate body. If individual fields are
    // short, the concatenation gives us enough signal to classify.
    source_language: detectLanguage(
      [
        params.scope,
        params.suggestedKpis,
        params.successCriteria,
        params.commonPitfalls,
        params.duration,
        params.resourceCommitment,
      ]
        .map((f) => f.trim())
        .filter(Boolean)
        .join("\n\n"),
    ),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
