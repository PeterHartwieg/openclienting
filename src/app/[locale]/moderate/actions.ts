"use server";

import { createClient } from "@/lib/supabase/server";

type TargetType = "problem_templates" | "requirements" | "pilot_frameworks";
type Action = "publish" | "reject";

export async function moderateItem(params: {
  targetType: TargetType;
  targetId: string;
  action: Action;
  rejectionReason?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden" };
  }

  const newStatus = params.action === "publish" ? "published" : "rejected";

  const updateData: Record<string, string | null> = { status: newStatus };
  if (params.action === "reject" && params.targetType === "problem_templates") {
    updateData.rejection_reason = params.rejectionReason ?? null;
  }

  const { error } = await supabase
    .from(params.targetType)
    .update(updateData)
    .eq("id", params.targetId);

  if (error) return { success: false, error: error.message };

  // Cascade: when approving a problem, also approve its initial requirements and pilot frameworks
  if (params.targetType === "problem_templates" && params.action === "publish") {
    // Get the problem's author to cascade only their initial submissions
    const { data: problem } = await supabase
      .from("problem_templates")
      .select("author_id")
      .eq("id", params.targetId)
      .single();

    if (problem) {
      await supabase
        .from("requirements")
        .update({ status: "published" })
        .eq("problem_id", params.targetId)
        .eq("author_id", problem.author_id)
        .eq("status", "submitted");

      await supabase
        .from("pilot_frameworks")
        .update({ status: "published" })
        .eq("problem_id", params.targetId)
        .eq("author_id", problem.author_id)
        .eq("status", "submitted");
    }
  }

  return { success: true };
}

export async function createTag(params: {
  name: string;
  slug: string;
  category: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("tags").insert({
    name: params.name.trim(),
    slug: params.slug.trim().toLowerCase(),
    category: params.category,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTag(tagId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
