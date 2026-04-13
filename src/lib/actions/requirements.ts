"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitRequirement(params: {
  problemId: string;
  body: string;
  isPubliclyAnonymous: boolean;
  isOrgAnonymous: boolean;
  organizationId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in to contribute" };
  if (!params.body.trim()) return { success: false, error: "Body is required" };

  const { error } = await supabase.from("requirements").insert({
    problem_id: params.problemId,
    body: params.body.trim(),
    author_id: user.id,
    author_organization_id: params.organizationId ?? null,
    is_publicly_anonymous: params.isPubliclyAnonymous,
    is_org_anonymous: params.isOrgAnonymous,
    status: "submitted",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
