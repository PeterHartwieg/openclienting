"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitSuccessReport(params: {
  solutionApproachId: string;
  body: string;
  anonymous: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in to contribute" };
  if (!params.body.trim()) return { success: false, error: "Body is required" };

  const { error } = await supabase.from("success_reports").insert({
    solution_approach_id: params.solutionApproachId,
    body: params.body.trim(),
    author_id: user.id,
    anonymous: params.anonymous,
    status: "submitted",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
