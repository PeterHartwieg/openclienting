"use server";

import { createClient } from "@/lib/supabase/server";
import type { EditTargetType, EditDiff } from "@/lib/types/database";
import {
  filterEditableDiff,
  isEditTargetType,
} from "@/lib/suggested-edits/fields";

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
  if (!isEditTargetType(params.targetType)) {
    return { success: false, error: "Unknown edit target type" };
  }
  if (Object.keys(params.diff).length === 0) {
    return { success: false, error: "No changes detected" };
  }

  // Reject submissions that include columns outside the per-target
  // allowlist. The UI never sends unknown keys, so dropped keys signal
  // client tampering — failing loud is safer than silently stripping.
  const { filtered, droppedKeys } = filterEditableDiff(
    params.targetType,
    params.diff,
  );
  if (droppedKeys.length > 0) {
    return {
      success: false,
      error: `These fields cannot be edited: ${droppedKeys.join(", ")}`,
    };
  }
  if (Object.keys(filtered).length === 0) {
    return { success: false, error: "No editable changes detected" };
  }

  const { error } = await supabase.from("suggested_edits").insert({
    target_type: params.targetType,
    target_id: params.targetId,
    diff: filtered,
    author_id: user.id,
    status: "submitted",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
