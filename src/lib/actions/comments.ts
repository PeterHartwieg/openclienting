"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitComment(params: {
  targetType: "problem_template" | "solution_approach";
  targetId: string;
  body: string;
  isPubliclyAnonymous: boolean;
  isOrgAnonymous: boolean;
  organizationId?: string;
  parentCommentId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in to comment" };
  if (!params.body.trim()) return { success: false, error: "Comment is required" };

  const { error } = await supabase.from("comments").insert({
    target_type: params.targetType,
    target_id: params.targetId,
    body: params.body.trim(),
    author_id: user.id,
    author_organization_id: params.organizationId ?? null,
    is_publicly_anonymous: params.isPubliclyAnonymous,
    is_org_anonymous: params.isOrgAnonymous,
    parent_comment_id: params.parentCommentId ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
