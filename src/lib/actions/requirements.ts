"use server";

import { createClient } from "@/lib/supabase/server";
import { detectLanguage } from "@/lib/i18n/detect-language";
import { resolveVerifiedMembership } from "@/lib/auth/org-membership";

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

  const membership = await resolveVerifiedMembership(
    supabase,
    user.id,
    params.organizationId,
  );
  if (!membership.ok) return { success: false, error: membership.error };

  // Standalone requirement contribution (not part of the initial problem
  // submission) — detect from its own body. Short bodies fall back to "en"
  // inside detectLanguage's min-length guard.
  const { error } = await supabase.from("requirements").insert({
    problem_id: params.problemId,
    body: params.body.trim(),
    author_id: user.id,
    author_organization_id: params.organizationId ?? null,
    is_publicly_anonymous: params.isPubliclyAnonymous,
    is_org_anonymous: params.isOrgAnonymous,
    status: "submitted",
    source_language: detectLanguage(params.body.trim()),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
