"use server";

import { createClient } from "@/lib/supabase/server";
import type { EditTargetType, EditDiff } from "@/lib/types/database";

function computeDiff(
  oldValues: Record<string, string | null>,
  newValues: Record<string, string | null>
): EditDiff {
  const diff: EditDiff = {};
  for (const key of Object.keys(newValues)) {
    if (newValues[key] !== oldValues[key]) {
      diff[key] = { old: oldValues[key] ?? null, new: newValues[key] ?? null };
    }
  }
  return diff;
}

async function logAndUpdate(params: {
  targetType: EditTargetType;
  tableName: string;
  targetId: string;
  oldValues: Record<string, string | null>;
  newValues: Record<string, string | null>;
  userId: string;
}) {
  const diff = computeDiff(params.oldValues, params.newValues);
  if (Object.keys(diff).length === 0) {
    return { success: false, error: "No changes detected" };
  }

  const supabase = await createClient();

  // Abuse control: block editing if too many recent reverts
  const { data: revertCount } = await supabase.rpc(
    "count_recent_reverted_revisions",
    { p_user_id: params.userId, p_window: "30 days" }
  );
  if (revertCount !== null && revertCount >= 3) {
    return {
      success: false,
      error:
        "Your recent edits have been reverted multiple times. Editing is temporarily restricted.",
    };
  }

  // Create revision record — goes live immediately, pending moderator recheck
  const { error: revisionError } = await supabase.from("content_revisions").insert({
    target_type: params.targetType,
    target_id: params.targetId,
    author_id: params.userId,
    diff,
    snapshot: params.oldValues, // pre-edit state; used for revert
  });
  if (revisionError) return { success: false, error: revisionError.message };

  // Apply the update
  const updateData: Record<string, string | null> = {};
  for (const [key, val] of Object.entries(diff)) {
    updateData[key] = val.new;
  }

  const { error: updateError } = await supabase
    .from(params.tableName)
    .update(updateData)
    .eq("id", params.targetId);

  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

export async function editProblem(params: {
  problemId: string;
  title?: string;
  description?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in required" };

  const { data: problem } = await supabase
    .from("problem_templates")
    .select("title, description, author_id, status")
    .eq("id", params.problemId)
    .single();

  if (!problem) return { success: false, error: "Problem not found" };
  if (problem.author_id !== user.id) return { success: false, error: "Not the author" };
  if (problem.status !== "published") return { success: false, error: "Only published content can be edited" };

  const newValues: Record<string, string | null> = {};
  if (params.title !== undefined) newValues.title = params.title.trim();
  if (params.description !== undefined) newValues.description = params.description.trim();

  return logAndUpdate({
    targetType: "problem_template",
    tableName: "problem_templates",
    targetId: params.problemId,
    oldValues: { title: problem.title, description: problem.description },
    newValues,
    userId: user.id,
  });
}

export async function editRequirement(params: {
  requirementId: string;
  body?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in required" };

  const { data: req } = await supabase
    .from("requirements")
    .select("body, author_id, status")
    .eq("id", params.requirementId)
    .single();

  if (!req) return { success: false, error: "Requirement not found" };
  if (req.author_id !== user.id) return { success: false, error: "Not the author" };
  if (req.status !== "published") return { success: false, error: "Only published content can be edited" };

  const newValues: Record<string, string | null> = {};
  if (params.body !== undefined) newValues.body = params.body.trim();

  return logAndUpdate({
    targetType: "requirement",
    tableName: "requirements",
    targetId: params.requirementId,
    oldValues: { body: req.body },
    newValues,
    userId: user.id,
  });
}

export async function editPilotFramework(params: {
  frameworkId: string;
  scope?: string;
  suggestedKpis?: string;
  successCriteria?: string;
  commonPitfalls?: string;
  duration?: string;
  resourceCommitment?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in required" };

  const { data: fw } = await supabase
    .from("pilot_frameworks")
    .select("scope, suggested_kpis, success_criteria, common_pitfalls, duration, resource_commitment, author_id, status")
    .eq("id", params.frameworkId)
    .single();

  if (!fw) return { success: false, error: "Pilot framework not found" };
  if (fw.author_id !== user.id) return { success: false, error: "Not the author" };
  if (fw.status !== "published") return { success: false, error: "Only published content can be edited" };

  const newValues: Record<string, string | null> = {};
  if (params.scope !== undefined) newValues.scope = params.scope.trim() || null;
  if (params.suggestedKpis !== undefined) newValues.suggested_kpis = params.suggestedKpis.trim() || null;
  if (params.successCriteria !== undefined) newValues.success_criteria = params.successCriteria.trim() || null;
  if (params.commonPitfalls !== undefined) newValues.common_pitfalls = params.commonPitfalls.trim() || null;
  if (params.duration !== undefined) newValues.duration = params.duration.trim() || null;
  if (params.resourceCommitment !== undefined) newValues.resource_commitment = params.resourceCommitment.trim() || null;

  return logAndUpdate({
    targetType: "pilot_framework",
    tableName: "pilot_frameworks",
    targetId: params.frameworkId,
    oldValues: {
      scope: fw.scope,
      suggested_kpis: fw.suggested_kpis,
      success_criteria: fw.success_criteria,
      common_pitfalls: fw.common_pitfalls,
      duration: fw.duration,
      resource_commitment: fw.resource_commitment,
    },
    newValues,
    userId: user.id,
  });
}

export async function editSolutionApproach(params: {
  approachId: string;
  title?: string;
  description?: string;
  complexity?: string;
  priceRange?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in required" };

  const { data: sa } = await supabase
    .from("solution_approaches")
    .select("title, description, complexity, price_range, author_id, status")
    .eq("id", params.approachId)
    .single();

  if (!sa) return { success: false, error: "Solution approach not found" };
  if (sa.author_id !== user.id) return { success: false, error: "Not the author" };
  if (sa.status !== "published") return { success: false, error: "Only published content can be edited" };

  const newValues: Record<string, string | null> = {};
  if (params.title !== undefined) newValues.title = params.title.trim();
  if (params.description !== undefined) newValues.description = params.description.trim();
  if (params.complexity !== undefined) newValues.complexity = params.complexity.trim() || null;
  if (params.priceRange !== undefined) newValues.price_range = params.priceRange.trim() || null;

  return logAndUpdate({
    targetType: "solution_approach",
    tableName: "solution_approaches",
    targetId: params.approachId,
    oldValues: {
      title: sa.title,
      description: sa.description,
      complexity: sa.complexity,
      price_range: sa.price_range,
    },
    newValues,
    userId: user.id,
  });
}
