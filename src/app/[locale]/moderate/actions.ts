"use server";

import { createClient } from "@/lib/supabase/server";

import type { EditDiff, EditTargetType } from "@/lib/types/database";

type TargetType = "problem_templates" | "requirements" | "pilot_frameworks" | "solution_approaches" | "success_reports" | "suggested_edits";
type Action = "publish" | "reject";

const targetTypeToTable: Record<EditTargetType, string> = {
  problem_template: "problem_templates",
  requirement: "requirements",
  pilot_framework: "pilot_frameworks",
  solution_approach: "solution_approaches",
};

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

// Dedicated action for success reports — sets both status and verification_status atomically.
// "verify" → published + verified (triggers successful_pilot if warranted)
// "reject" → rejected + rejected
export async function moderateSuccessReport(params: {
  reportId: string;
  decision: "verify" | "reject";
  reviewerNotes?: string;
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

  const newStatus = params.decision === "verify" ? "published" : "rejected";
  const newVerificationStatus = params.decision === "verify" ? "verified" : "rejected";

  const { error } = await supabase
    .from("success_reports")
    .update({
      status: newStatus,
      verification_status: newVerificationStatus,
    })
    .eq("id", params.reportId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function approveRevision(revisionId: string, reviewerNotes?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden" };
  }

  const { error } = await supabase
    .from("content_revisions")
    .update({
      revision_status: "approved",
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq("id", revisionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function revertRevision(revisionId: string, reviewerNotes?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden" };
  }

  const { data: revision } = await supabase
    .from("content_revisions")
    .select("target_type, target_id, diff, snapshot")
    .eq("id", revisionId)
    .single();

  if (!revision) return { success: false, error: "Revision not found" };

  // Restore pre-edit state from snapshot (preferred) or diff old-values
  const restoreData: Record<string, string | null> = {};
  if (revision.snapshot) {
    Object.assign(restoreData, revision.snapshot as Record<string, string | null>);
  } else {
    const diff = revision.diff as EditDiff;
    for (const [key, val] of Object.entries(diff)) {
      restoreData[key] = val.old;
    }
  }

  const tableName = targetTypeToTable[revision.target_type as EditTargetType];
  const { error: restoreError } = await supabase
    .from(tableName)
    .update(restoreData)
    .eq("id", revision.target_id);

  if (restoreError) return { success: false, error: restoreError.message };

  const { error: revisionError } = await supabase
    .from("content_revisions")
    .update({
      revision_status: "reverted",
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq("id", revisionId);

  if (revisionError) return { success: false, error: revisionError.message };
  return { success: true };
}

export async function deleteTag(tagId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function applySuggestedEdit(editId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden" };
  }

  // Fetch the suggested edit
  const { data: edit } = await supabase
    .from("suggested_edits")
    .select("*")
    .eq("id", editId)
    .single();

  if (!edit) return { success: false, error: "Edit not found" };
  if (edit.status !== "submitted" && edit.status !== "in_review") {
    return { success: false, error: "Edit already processed" };
  }

  const diff = edit.diff as EditDiff;
  const tableName = targetTypeToTable[edit.target_type as EditTargetType];

  // Apply the changes
  const updateData: Record<string, string | null> = {};
  for (const [key, val] of Object.entries(diff)) {
    updateData[key] = val.new;
  }

  const { error: updateError } = await supabase
    .from(tableName)
    .update(updateData)
    .eq("id", edit.target_id);

  if (updateError) return { success: false, error: updateError.message };

  // Log to edit_history
  await supabase.from("edit_history").insert({
    target_type: edit.target_type,
    target_id: edit.target_id,
    author_id: edit.author_id,
    diff,
  });

  // Mark as published
  const { error: statusError } = await supabase
    .from("suggested_edits")
    .update({ status: "published" })
    .eq("id", editId);

  if (statusError) return { success: false, error: statusError.message };
  return { success: true };
}
