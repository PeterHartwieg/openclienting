"use server";

import { createClient } from "@/lib/supabase/server";
import type { EditTargetType, EditDiff } from "@/lib/types/database";

export async function submitSuggestedEdit(params: {
  targetType: EditTargetType;
  targetId: string;
  diff: EditDiff;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in to suggest edits" };
  if (Object.keys(params.diff).length === 0) return { success: false, error: "No changes detected" };

  const { error } = await supabase.from("suggested_edits").insert({
    target_type: params.targetType,
    target_id: params.targetId,
    diff: params.diff,
    author_id: user.id,
    status: "submitted",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
