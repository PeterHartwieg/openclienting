"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  TranslationFields,
  TranslationTargetType,
} from "@/lib/types/database";
import {
  TRANSLATABLE_FIELDS,
  isTranslationTargetType,
} from "@/lib/content-translations/fields";
import { LANGUAGE_CODES } from "@/i18n/languages";

/**
 * Server actions for the open-source translations feature.
 *
 * - `proposeTranslation` — any signed-in user can submit a translation
 *   for a target row. Status starts at `submitted`. RLS also enforces
 *   the `author_id = auth.uid()` check, this action adds field-name
 *   validation and language-code validation on top.
 * - `approveTranslation` / `rejectTranslation` — moderator-only.
 *   Flips status, busts caches so render paths immediately pick up
 *   the approved translation.
 *
 * Validation notes:
 *  - Empty fields are dropped on write — a translator can translate
 *    only the fields they know, and the merge helper skips empty
 *    values at render time so the English source shines through.
 *  - Language codes must be in our LANGUAGE_CODES allowlist so we
 *    don't accumulate junk locale strings.
 *  - Field names must be in the per-target allowlist — prevents a
 *    malicious contributor from writing unrelated JSONB keys that
 *    a future render path might trust.
 */

type ActionResult = { success: true } | { success: false; error: string };

async function requireSignedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };
  return { ok: true as const, supabase, userId: user.id };
}

async function requireModerator() {
  const signedIn = await requireSignedIn();
  if (!signedIn.ok) return signedIn;
  const { data: profile } = await signedIn.supabase
    .from("profiles")
    .select("role")
    .eq("id", signedIn.userId)
    .single();
  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { ok: false as const, error: "Forbidden" };
  }
  return signedIn;
}

function sanitizeFields(
  targetType: TranslationTargetType,
  input: Record<string, unknown>,
): TranslationFields {
  const allowlist = TRANSLATABLE_FIELDS[targetType].map((f) => f.name);
  const out: TranslationFields = {};
  for (const key of allowlist) {
    const value = input[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    out[key] = trimmed;
  }
  return out;
}

export async function proposeTranslation(params: {
  targetType: string;
  targetId: string;
  language: string;
  fields: Record<string, string>;
}): Promise<ActionResult> {
  if (!isTranslationTargetType(params.targetType)) {
    return { success: false, error: "Invalid target type" };
  }
  const language = params.language.trim().toLowerCase();
  if (!LANGUAGE_CODES.includes(language)) {
    return { success: false, error: "Unsupported language" };
  }
  const fields = sanitizeFields(params.targetType, params.fields);
  if (Object.keys(fields).length === 0) {
    return { success: false, error: "No fields provided" };
  }

  const auth = await requireSignedIn();
  if (!auth.ok) return { success: false, error: auth.error };

  // Reject proposals that "translate" a row into its own source
  // language — that would collide with the source row and makes no
  // sense. The row's source_language is detected on submission
  // (detectLanguage) so this check adapts automatically when a
  // German-authored problem appears.
  const table =
    params.targetType === "problem_template" ? "problem_templates"
    : params.targetType === "requirement" ? "requirements"
    : params.targetType === "pilot_framework" ? "pilot_frameworks"
    : "solution_approaches";
  const { data: row, error: rowError } = await auth.supabase
    .from(table)
    .select("source_language")
    .eq("id", params.targetId)
    .maybeSingle();
  if (rowError || !row) {
    return { success: false, error: "Target not found" };
  }
  const sourceLanguage = (row as { source_language: string | null }).source_language ?? "en";
  if (language === sourceLanguage) {
    return { success: false, error: "This is the source language" };
  }

  const { error } = await auth.supabase.from("content_translations").insert({
    target_type: params.targetType,
    target_id: params.targetId,
    language,
    fields,
    author_id: auth.userId,
    source_version: new Date().toISOString(),
    status: "submitted",
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function approveTranslation(
  translationId: string,
): Promise<ActionResult> {
  const auth = await requireModerator();
  if (!auth.ok) return { success: false, error: auth.error };

  // Fetch the row so we know which (target_type, target_id, language)
  // we're about to publish. We need the target_type for cache busting
  // and the (target_id, language) tuple for the "displace previously
  // published translation" step.
  const { data: translation, error: fetchError } = await auth.supabase
    .from("content_translations")
    .select("id, target_type, target_id, language, status")
    .eq("id", translationId)
    .single();
  if (fetchError || !translation) {
    return { success: false, error: "Translation not found" };
  }
  if (translation.status !== "submitted" && translation.status !== "in_review") {
    return { success: false, error: "Already processed" };
  }

  // Partial unique index enforces at most one published row per
  // (target_type, target_id, language). Displace the current one
  // (if any) before approving this one. This supports the "second
  // translator improves the first translation" flow.
  await auth.supabase
    .from("content_translations")
    .update({ status: "rejected" })
    .eq("target_type", translation.target_type)
    .eq("target_id", translation.target_id)
    .eq("language", translation.language)
    .eq("status", "published");

  const { error } = await auth.supabase
    .from("content_translations")
    .update({
      status: "published",
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", translationId);
  if (error) return { success: false, error: error.message };

  // Bust any cached list queries that include the translated target.
  // Problem detail fetches use React.cache (per-request), so they
  // don't need busting — only the list pages (home, problems list)
  // cache across requests.
  if (translation.target_type === "problem_template") {
    updateTag("problem_templates");
  } else if (translation.target_type === "solution_approach") {
    updateTag("solution_approaches");
  }
  updateTag("content_translations");
  return { success: true };
}

export async function rejectTranslation(
  translationId: string,
): Promise<ActionResult> {
  const auth = await requireModerator();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("content_translations")
    .update({
      status: "rejected",
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", translationId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
