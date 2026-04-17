"use server";

import { createClient } from "@/lib/supabase/server";
import { invalidateFor, invalidateForMany } from "@/lib/cache/tags";

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

// Map from the plural table-name TargetType (used by callers) to the
// singular target_type token the moderate_item_v1 RPC expects.
const tableToRpcTargetType: Record<TargetType, string> = {
  problem_templates:    "problem_template",
  requirements:         "requirement",
  pilot_frameworks:     "pilot_framework",
  solution_approaches:  "solution_approach",
  success_reports:      "success_report",
  suggested_edits:      "suggested_edit",
  knowledge_articles:   "knowledge_article",
};

export async function moderateItem(params: {
  targetType: TargetType;
  targetId: string;
  action: Action;
  rejectionReason?: string;
}) {
  const supabase = await createClient();

  // Auth check — we still need the user for analytics/logging even though
  // the RPC re-validates the moderator role server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const p_target_type = tableToRpcTargetType[params.targetType];
  const p_decision = params.action === "publish" ? "approved" : "rejected";

  const { error } = await supabase.rpc("moderate_item_v1", {
    p_target_type,
    p_target_id: params.targetId,
    p_decision,
    p_reason: params.rejectionReason ?? null,
  });

  if (error) return { success: false, error: error.message };

  // Invalidate any unstable_cache entries affected by this mutation.
  if (params.targetType === "problem_templates") {
    invalidateFor("problem");
  } else if (params.targetType === "solution_approaches") {
    invalidateFor("solution");
  } else if (params.targetType === "knowledge_articles") {
    invalidateFor("knowledge_article");
  } else if (params.targetType === "success_reports") {
    invalidateFor("success_report");
  } else if (params.targetType === "requirements") {
    invalidateFor("requirement");
  } else if (params.targetType === "pilot_frameworks") {
    invalidateFor("pilot_framework");
  } else {
    // For suggested_edits — moderation events still need busting even though
    // the suggested_edit rows themselves have no cached loader in submitted state.
    invalidateFor("moderation_event");
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
  // Problems list embeds tag metadata via problem_tags join — bust both.
  invalidateFor("tag");
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
  invalidateFor("tag");
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

  // A verified report can flip the parent problem's solution_status to
  // successful_pilot, so bust both success_reports and problem_templates.
  invalidateForMany(["success_report", "problem"]);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Feature / unfeature a success report on the homepage.
// Only moderators/admins may call these actions.
// Both invalidate "featured_success_report" so the loader cache clears.
// ---------------------------------------------------------------------------

export async function featureSuccessReport(opts: {
  successReportId: string;
  locale: string;
  displayOrder?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
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

  // Upsert: on conflict of (success_report_id, locale) re-feature the row
  // by resetting unfeatured_at to null and updating the mutable fields.
  const { error } = await supabase
    .from("featured_success_report")
    .upsert(
      {
        success_report_id: opts.successReportId,
        locale: opts.locale,
        display_order: opts.displayOrder ?? 0,
        featured_by: user.id,
        featured_at: new Date().toISOString(),
        unfeatured_at: null,
      },
      { onConflict: "success_report_id,locale" },
    );

  if (error) return { success: false, error: error.message };

  invalidateFor("featured_success_report");
  return { success: true };
}

export async function unfeatureSuccessReport(opts: {
  featuredId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
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

  const { error } = await supabase
    .from("featured_success_report")
    .update({ unfeatured_at: new Date().toISOString() })
    .eq("id", opts.featuredId);

  if (error) return { success: false, error: error.message };

  invalidateFor("featured_success_report");
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

  // Bust the caches for the restored content type.
  if (targetType === "problem_template") {
    invalidateFor("problem");
  } else if (targetType === "solution_approach") {
    invalidateFor("solution");
  } else if (targetType === "knowledge_article") {
    invalidateFor("knowledge_article");
  } else if (targetType === "requirement") {
    invalidateFor("requirement");
  } else if (targetType === "pilot_framework") {
    invalidateFor("pilot_framework");
  }
  return { success: true };
}

export async function deleteTag(tagId: string) {
  const supabase = await createClient();

  const auth = await requireModerator(supabase);
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) return { success: false, error: error.message };
  invalidateFor("tag");
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

  // Bust the caches for the edited content type.
  if (targetType === "problem_template") {
    invalidateFor("problem");
  } else if (targetType === "solution_approach") {
    invalidateFor("solution");
  } else if (targetType === "knowledge_article") {
    invalidateFor("knowledge_article");
  } else if (targetType === "requirement") {
    invalidateFor("requirement");
  } else if (targetType === "pilot_framework") {
    invalidateFor("pilot_framework");
  }
  return { success: true };
}
