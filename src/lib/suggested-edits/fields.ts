/**
 * Per-target-type allowlist of columns that a suggested edit may touch.
 *
 * The `suggested_edits.diff` column is JSONB and accepts caller-provided
 * keys. Without this filter, an approved edit could rewrite arbitrary
 * columns including `status`, `author_id`, counters, or verification
 * flags. Mirrors the pattern in `@/lib/content-translations/fields.ts`.
 *
 * Enforced at two points:
 *   1. `submitSuggestedEdit` — unknown keys are a client tampering signal,
 *      reject the submission rather than silently strip.
 *   2. `applySuggestedEdit` — re-filter the stored diff before writing, so
 *      a row inserted by another path (compromised account, old data)
 *      still cannot escape the allowlist.
 */

import type { EditDiff, EditTargetType } from "@/lib/types/database";

export const EDITABLE_FIELDS: Record<EditTargetType, readonly string[]> = {
  problem_template: ["title", "description"],
  requirement: ["body"],
  pilot_framework: [
    "scope",
    "suggested_kpis",
    "success_criteria",
    "common_pitfalls",
    "duration",
    "resource_commitment",
  ],
  solution_approach: ["title", "description", "complexity", "price_range"],
  knowledge_article: [
    "title",
    "short_label",
    "lede",
    "meta_title",
    "meta_description",
    "tldr_title",
    "detail_title",
    "detail_intro",
    "faq_title",
  ],
} as const;

export function isEditTargetType(value: string): value is EditTargetType {
  return value in EDITABLE_FIELDS;
}

/**
 * Split `diff` into the allowlisted keys and any dropped keys. Callers
 * should usually reject the whole submission if `droppedKeys` is non-empty
 * (the UI never submits unknown keys, so dropped keys imply tampering).
 * The apply path uses `filtered` as the safe write set even if it chooses
 * to log and continue rather than fail.
 */
export function filterEditableDiff(
  targetType: EditTargetType,
  diff: EditDiff,
): { filtered: EditDiff; droppedKeys: string[] } {
  const allow = new Set(EDITABLE_FIELDS[targetType]);
  const filtered: EditDiff = {};
  const droppedKeys: string[] = [];

  for (const [key, value] of Object.entries(diff)) {
    if (allow.has(key)) {
      filtered[key] = value;
    } else {
      droppedKeys.push(key);
    }
  }

  return { filtered, droppedKeys };
}
