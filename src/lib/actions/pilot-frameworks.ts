"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitPilotFramework(params: {
  problemId: string;
  scope: string;
  suggestedKpis: string;
  successCriteria: string;
  commonPitfalls: string;
  duration: string;
  resourceCommitment: string;
  anonymous: boolean;
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
    is_publicly_anonymous: params.anonymous,
    status: "submitted",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
