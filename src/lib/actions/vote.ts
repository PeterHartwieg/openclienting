"use server";

import { createClient } from "@/lib/supabase/server";
import { invalidateFor } from "@/lib/cache/tags";

export async function toggleVote(targetType: "requirement" | "pilot_framework" | "solution_approach", targetId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in to vote" };

  // Check if vote exists
  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    // Remove vote
    const { error } = await supabase.from("votes").delete().eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    // A DB trigger updates upvote_count on the voted entity row.
    // getPublishedProblemForMarkdown caches upvote_count — bust it.
    invalidateFor("problem");
    return { success: true, voted: false };
  } else {
    // Add vote
    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
    });
    if (error) return { success: false, error: error.message };
    // Same: bust the problem cache so vote counts stay fresh.
    invalidateFor("problem");
    return { success: true, voted: true };
  }
}
