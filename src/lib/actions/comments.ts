"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitComment(params: {
  targetType: "problem_template";
  targetId: string;
  body: string;
  anonymous: boolean;
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
    anonymous: params.anonymous,
    parent_comment_id: params.parentCommentId ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
