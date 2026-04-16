"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

import type { EditDiff, EditTargetType } from "@/lib/types/database";
import { filterEditableDiff } from "@/lib/suggested-edits/fields";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

type TargetType = "problem_templates" | "requirements" | "pilot_frameworks" | "solution_approaches" | "success_reports" | "suggested_edits" | "knowledge_articles";
type Action = "publish" | "reject";

const targetTypeToTable: Record<EditTargetType, string> = {
  problem_template: "problem_templates",
  requirement: "requirements",
  pilot_framework: "pilot_frameworks",
  solution_approach: "solution_approaches",
  knowledge_article: "knowledge_articles",
};

// Map an edit target type to the unstable_cache tags that must be revalidated
// when that target's rows change. Keep in sync with cache definitions in
// `src/lib/queries/*.ts` and `src/lib/queries/home.ts`.
function tagsForEditTarget(target: EditTargetType): string[] {
  switch (target) {
    case "problem_template":
      return ["problem_templates"];
    case "solution_approach":
      return ["solution_approaches"];
    case "knowledge_article":
      return ["knowledge_articles"];
    // requirements and pilot_frameworks aren't in any cached list query; they
    // live on problem detail, which is React.cache per request only.
    case "requirement":
    case "pilot_framework":
      return [];
  }
}

// Server actions are not a security boundary on their own — any caller who
// can hit the action endpoint can invoke them. RLS protects most tables, but
// the `tags` taxonomy is editable by the service role used by these actions,
// so we must enforce moderator/admin role here before any tag mutation.
async function requireModerator(
  supabase: SupabaseServer,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { ok: false, error: "Forbidden" };
  }

  return { ok: true };
}

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

  // Invalidate any unstable_cache entries affected by this mutation.
  if (params.targetType === "problem_templates") {
    updateTag("problem_templates");
  } else if (params.targetType === "solution_approaches") {
    updateTag("solution_approaches");
  } else if (params.targetType === "knowledge_articles") {
    updateTag("knowledge_articles");
  }

  return { success: true };
}

export async function createTag(params: {
  name: string;
  name_de?: string | null;
  slug: string;
  category: string;
}) {
  const supabase = await createClient();

  const auth = await requireModerator(supabase);
  if (!auth.ok) return { success: false, error: auth.error };

  const trimmedDe = params.name_de?.trim();

  const { error } = await supabase.from("tags").insert({
    name: params.name.trim(),
    name_de: trimmedDe ? trimmedDe : null,
    slug: params.slug.trim().toLowerCase(),
    category: params.category,
  });

  if (error) return { success: false, error: error.message };
  updateTag("tags");
  // Problems list embeds tag metadata via problem_tags join, so the tag tag
  // alone isn't enough — also bust the problem list cache.
  updateTag("problem_templates");
  return { success: true };
}

export async function updateTagTranslation(params: {
  tagId: string;
  name_de: string | null;
}) {
  const supabase = await createClient();

  const auth = await requireModerator(supabase);
  if (!auth.ok) return { success: false, error: auth.error };

  const trimmed = params.name_de?.trim();
  const { error } = await supabase
    .from("tags")
    .update({ name_de: trimmed ? trimmed : null })
    .eq("id", params.tagId);

  if (error) return { success: false, error: error.message };
  updateTag("tags");
  updateTag("problem_templates");
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

  updateTag("success_reports");
  // A verified report can flip the parent problem's solution_status to
  // successful_pilot, so the problems list and home stats must refresh too.
  updateTag("problem_templates");
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

  const targetType = revision.target_type as EditTargetType;
  const tableName = targetTypeToTable[targetType];
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

  for (const tag of tagsForEditTarget(targetType)) updateTag(tag);
  return { success: true };
}

export async function deleteTag(tagId: string) {
  const supabase = await createClient();

  const auth = await requireModerator(supabase);
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) return { success: false, error: error.message };
  updateTag("tags");
  updateTag("problem_templates");
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

  const rawDiff = edit.diff as EditDiff;
  const targetType = edit.target_type as EditTargetType;
  const tableName = targetTypeToTable[targetType];

  // Defence in depth: even though submitSuggestedEdit now rejects diffs
  // with keys outside the allowlist, re-filter here so a row inserted via
  // another path (compromised account, legacy data, manual SQL) still
  // can't escape the allowlist.
  const { filtered: diff, droppedKeys } = filterEditableDiff(targetType, rawDiff);
  if (droppedKeys.length > 0) {
    console.warn(
      `[applySuggestedEdit] dropping non-allowlisted keys from edit ${editId}:`,
      droppedKeys,
    );
  }
  if (Object.keys(diff).length === 0) {
    return { success: false, error: "No editable changes in this suggestion" };
  }

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

  // Log to edit_history — record the filtered diff (what actually
  // applied) rather than the original, so the audit trail matches state.
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

  for (const tag of tagsForEditTarget(targetType)) updateTag(tag);
  return { success: true };
}
